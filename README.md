# Voltage Drop Simulator

A web platform for electrical engineers to model **low-voltage distribution
networks**, run **quasi-steady-state (QSS) time-series simulations**, and analyse
power-quality violations against **EN 50160** and **IEEE 1159**.

The project is built as much around its **delivery platform** as around the
simulator itself: every environment is described declaratively, images are built
and versioned by CI, and the cluster is continuously reconciled from Git by
ArgoCD. This README documents both the application and, in more depth, the
infrastructure and delivery pipeline around it.

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Delivery pipeline](#delivery-pipeline)
  - [Continuous integration (GitHub Actions)](#1-continuous-integration-github-actions)
  - [Image tagging strategy](#image-tagging-strategy)
  - [Continuous delivery (write-back)](#continuous-delivery-write-back)
  - [GitOps with ArgoCD](#gitops-with-argocd)
  - [Kustomize structure](#kustomize-structure)
- [Observability](#observability)
- [Running on Kubernetes (kind)](#running-on-kubernetes-kind)
- [Operations runbook](#operations-runbook)
- [Notes and limitations](#notes-and-limitations)

---

## Overview

The simulator models a **radial low-voltage tree**: one `SOURCE` (substation),
`JUNCTION` buses, and `CONSUMER` loads connected by **cables selected from a
catalog** (never hand-entered R/X, to keep traceability to IEC/EN reference
data). A QSS forward/backward-sweep solver produces a voltage profile per node
over time; results are classified into standard power-quality events.

Key capabilities:

- **Grid builder** — interactive topology editor (Cytoscape.js), with radial
  validation and island detection before a run is accepted.
- **QSS simulation engine** — forward/backward sweep with configurable
  convergence tolerance and iteration cap.
- **Norm compliance** — EN 50160 voltage-band checks and IEEE 1159 sag/swell
  event classification.
- **Time-series playback** — step through the result set and watch cable
  coloration change.
- **Load profiles** — SVG Catmull-Rom curve editor with draggable control
  points.
- **Catalog-driven equipment** — cables and load presets served from MongoDB.
- **Cable sizing suggestions** — per-consumer path ranking with a manual
  "apply" preview.

---

## Architecture

### Local development (Docker Compose)

```
        browser
           │  :4200 (hot reload)               :80 (production build)
           ▼
      ┌──────────┐        /api/*         ┌──────────────┐
      │ frontend │ ────────────────────► │   backend    │
      │ Angular  │   (proxy / ingress)   │ Spring Boot  │
      └──────────┘                       └──────┬───────┘
                                        ┌───────┼────────┐
                                        ▼       ▼        ▼
                                    postgres  mongo   rabbitmq
                                    (results, (catalogs) (async,
                                     projects)            planned)
```

### Delivery platform (CI/CD + GitOps)

```
   developer ──push──► GitHub  main
                         │
                         ├─ Actions ── backend-ci / frontend-ci
                         │      ├─ build & test
                         │      ├─ push image ──► ghcr.io/…/vds-{backend,frontend}:sha-<7>
                         │      └─ write-back: commit the new tag in the overlay
                         │
                         ▼
                 Git = single source of truth
                         │  (ArgoCD watches main)
                         ▼
        ┌──────────────────────── kind cluster (vds) ─────────────────────────┐
        │  ArgoCD ── root app-of-apps ──► child Applications ──► workloads      │
        │                                                                       │
        │  ingress-nginx :80                                                    │
        │    vds.localhost       ──► frontend:80 ──/api──► backend:8080         │
        │    argocd.localhost    ──► argocd-server:443                          │
        │    grafana.localhost   ──► kps-grafana:80                             │
        │    prometheus.localhost──► kps-kube-prometheus-prometheus:9090        │
        │                                                                       │
        │  ns vds          : postgres, mongodb, rabbitmq, backend, frontend     │
        │  ns monitoring   : prometheus, grafana, loki, promtail, alertmanager  │
        │  ns argocd       : ArgoCD controllers + Application objects           │
        └───────────────────────────────────────────────────────────────────────┘
```

The important property: **a `git push` to `main` is the only deploy action.**
CI turns the commit into an immutable image and records it in Git; ArgoCD
reconciles the cluster to whatever Git says.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 21, Cytoscape.js, Chart.js, nginx |
| Backend | Spring Boot 3.3.1, Java 17, Spring Security (JWT), Spring Data JPA & MongoDB, Apache POI |
| Datastores | PostgreSQL 17 (projects, simulation results), MongoDB 7 (cable/load catalogs) |
| Messaging | RabbitMQ 3.13 (provisioned; async simulation jobs planned) |
| Containers | Docker, multi-stage builds |
| CI | GitHub Actions |
| Registry | GitHub Container Registry (GHCR) |
| CD / GitOps | ArgoCD, Kustomize, Helm |
| Runtime | Kubernetes (kind for local), ingress-nginx |
| Observability | Prometheus, Grafana, Loki, Promtail |

---

## Repository layout

```
.
├── backend/                      # Spring Boot service
│   ├── src/main/java/...         # controllers, services, solver, catalogs
│   ├── src/main/resources/application.yaml
│   └── Dockerfile                # multi-stage: maven build -> JRE runtime
├── frontend/                     # Angular app
│   ├── src/app/                  # components, services, shared utils
│   ├── Dockerfile                # multi-stage: node build -> nginx runtime
│   ├── Dockerfile.dev            # `ng serve` with hot reload (Compose dev)
│   └── nginx.conf
├── gitops/                       # everything Kubernetes, reconciled by ArgoCD
│   ├── bootstrap/root.yaml       # the app-of-apps root (the ONE manual apply)
│   ├── argo-apps/                # one Application manifest per deployed app
│   │   ├── voltage-drop-sim.yaml
│   │   ├── kube-prometheus-stack.yaml
│   │   ├── loki.yaml
│   │   ├── promtail.yaml
│   │   ├── grafana-dashboards.yaml
│   │   └── argocd-ingress.yaml
│   ├── apps/voltage-drop-sim/    # workload manifests (Kustomize)
│   │   ├── base/                 # environment-agnostic desired state
│   │   └── overlays/kind/        # environment pins (image tags)
│   ├── platform/                 # manifests managed by platform Applications
│   │   ├── monitoring/dashboards/
│   │   └── argocd/ingress.yaml
│   └── scripts/bump-image-tag.py # used by CI to pin a new image tag
├── deploy/kind/kind-config.yaml  # local cluster definition
├── examples/                     # sample network / scenario JSON
├── docker-compose.yaml           # production-style local stack
├── docker-compose-dev.yaml       # hot-reload local stack
└── mongo-seed.js                 # catalog seed data
```

---

## Getting started

### Prerequisites

- Docker + Docker Compose (local stack)
- Node.js 20+ (frontend tooling)
- Java 17 and Maven (or the bundled `backend/mvnw`)
- For the cluster path: `kind`, `kubectl`, `helm`, and `argocd` CLI

### Local stack (production-style)

```bash
cp .env.example .env          # then edit DB_NAME / DB_USERNAME / DB_PASSWORD
docker compose up --build
```

- Frontend → http://localhost:80
- Backend  → http://localhost:8080
- RabbitMQ management → http://localhost:15672
- PostgreSQL → localhost:5432, MongoDB → localhost:27017

### Local stack (hot reload)

```bash
cp .env.example .env
docker compose -f docker-compose-dev.yaml up --build
```

The frontend runs `ng serve` on port `4200` with source mounted, and proxies
`/api` to the backend (`frontend/proxy.conf.json`). The backend is rebuilt by
Compose as before.

### Running a service directly

```bash
# backend
cd backend && ./mvnw spring-boot:run

# frontend
cd frontend && npm ci && npm start
```

---

## Configuration

### Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` | postgres, backend | database name and credentials |
| `DB_PORT` | postgres | host port mapping (default `5432`) |
| `JWT_SECRET` | backend | signing key for issued tokens |
| `SPRING_DATASOURCE_URL` | backend | JDBC URL for PostgreSQL |
| `SPRING_DATA_MONGODB_URI` | backend | MongoDB connection URI |
| `SPRING_RABBITMQ_HOST` / `_USERNAME` / `_PASSWORD` | backend | broker connection |

Simulation parameters (tolerances, active norm, EN 50160 band, IEEE 1159
thresholds) live in `backend/src/main/resources/application.yaml` under
`simulation.*`.

### Secrets

Secrets are **never committed**. `.gitignore` excludes `.env` and any
`**/secret.yaml`, while allowing the `*.example` templates through:

- Local: `.env` (from `.env.example`).
- Cluster: a `vds-db-secret` Secret consumed by the backend Deployment via
  `secretKeyRef`. Create it out-of-band (see the runbook below); the GitOps
  tree intentionally ships only `secret.example.yaml`.

---

## Delivery pipeline

This is the core of the project. The pipeline has four moving parts:
**CI build → image pin (write-back) → GitOps reconciliation → observation**.

### 1. Continuous integration (GitHub Actions)

Two independent workflows, each scoped so it only runs for its own component:

| Workflow | Trigger paths | Steps |
| --- | --- | --- |
| `backend-ci.yml` | `backend/**`, itself | run unit tests → login → buildx → docker metadata → build & push `vds-backend` |
| `frontend-ci.yml` | `frontend/**`, itself | `npm ci` → production build → push `vds-frontend` |

Notes:

- Both workflows use `docker/setup-buildx-action` so the GitHub Actions cache
  (`cache-from/to: type=gha,mode=max`) can be exported — the default docker
  driver cannot.
- The backend test step runs the JUnit suite but **excludes the
  context-loading `SpringBootTest`**, which needs live Postgres/Mongo.
- Frontend unit tests are currently **disabled** in CI (the generated specs
  need a real canvas / are stale); only the production build gates the image.
- On `pull_request`, the image is built but **not pushed** — PRs are validated
  only.

### Image tagging strategy

`docker/metadata-action` produces several tags, but the one the cluster tracks
is the **immutable short-SHA tag** `sha-<7>`. The `latest` tag exists but is
never deployed, so a running Pod always maps to an exact commit.

### Continuous delivery (write-back)

ArgoCD only reconciles **Git**, so after CI pushes an image it must also record
the new tag. A second job (`update-tag`) in each workflow does exactly that:

```
build ──► update-tag ──► git commit "cd(backend): pin image to <sha>" ──► push main
                            (edits only gitops/apps/.../overlays/kind/kustomization.yaml)
```

Design notes worth calling out:

- **Surgical edit.** `gitops/scripts/bump-image-tag.py` rewrites only the
  `newTag` line of the matching image, preserving comments and formatting, and
  fails loudly unless it finds exactly one match.
- **No infinite loop.** Pushes made with the default `GITHUB_TOKEN` do not
  trigger further workflows; the bot commit only touches `gitops/**`, which is
  not in any build workflow's `paths`.
- **No races.** Both workflows share `concurrency: gitops-writeback`
  (`cancel-in-progress: false`) so the two write-backs queue instead of
  clobbering the overlay file; the push step also retries via
  `git pull --rebase --autostash`.
- **Least privilege.** The job upgrades to `contents: write` (to push) and
  drops `packages: write` it no longer needs.

### GitOps with ArgoCD

**App-of-apps.** A single root Application is applied by hand exactly once:

```bash
kubectl apply -f gitops/bootstrap/root.yaml
```

`root` points at the `gitops/argo-apps/` directory; ArgoCD applies every
`Application` manifest it finds there, and those children deploy the actual
workloads/charts. From that point on, **the topology is versioned in Git** and
adding a service means adding one file.

```
gitops/bootstrap/root.yaml
        │ source.path: gitops/argo-apps
        ▼
  argo-apps/*.yaml  ──►  child Applications  ──►  Helm charts / Kustomize overlays
```

- The root lives **outside** the directory it manages, so it never manages
  itself.
- Children carry `resources-finalizer.argocd.argoproj.io`, so pruning an
  Application cleans up its workloads.
- Every application runs `syncPolicy.automated` with **`prune: true`** and
  **`selfHeal: true`**: Git deletions remove resources, and manual drift is
  reverted.

### Kustomize structure

```
gitops/apps/voltage-drop-sim/
├── base/                 # environment-agnostic: Deployments, Services,
│                         # ConfigMap, Ingress, ServiceMonitor
└── overlays/kind/        # environment-specific: image tags only
    └── kustomization.yaml  #  <-- CI write-back edits this file
```

The overlay's `images:` block is the single place that declares which image
tags run. The base intentionally excludes `secret.example.yaml` so a placeholder
Secret can never clobber the real one.

---

## Observability

The monitoring stack is itself deployed as Applications (`gitops/argo-apps/`):

| Component | Chart / source | Notes |
| --- | --- | --- |
| Prometheus / Alertmanager / Grafana | `kube-prometheus-stack` (pinned) | release name `kps`; Prometheus selects ServiceMonitors across all namespaces |
| Loki | `loki` (pinned) | single-binary, filesystem storage, gateway enabled |
| Promtail | `promtail` (pinned) | ships container logs to Loki |
| Dashboards | `gitops/platform/monitoring/dashboards/` | provisioned via the Grafana sidecar `ConfigMap` |

The backend is scraped through a `ServiceMonitor`
(`gitops/apps/voltage-drop-sim/base/backend-servicemonitor.yaml`) that targets
Spring Boot Actuator's `/actuator/prometheus` endpoint on the `http` port.
Grafana is pre-wired with **Prometheus and Loki datasources**, so metrics and
logs sit side by side.

Host entry points (local):

```
127.0.0.1 vds.localhost
127.0.0.1 argocd.localhost
127.0.0.1 grafana.localhost
127.0.0.1 prometheus.localhost
```

Grafana requires authentication (`admin.existingSecret`), Prometheus does not —
keep it local-only or add auth before exposing it.

---

## Running on Kubernetes (kind)

```bash
# 1. Cluster with an ingress-ready node (HTTP on host :80)
kind create cluster --config deploy/kind/kind-config.yaml

# 2. ingress-nginx
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# 3. ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 4. Create the app Secret (never in Git)
kubectl create secret generic vds-db-secret -n vds \
  --from-literal=DB_NAME=... \
  --from-literal=DB_USERNAME=... \
  --from-literal=DB_PASSWORD=... \
  --from-literal=JWT_SECRET=...

# 5. Bootstrap the platform — the only manual apply
kubectl apply -f gitops/bootstrap/root.yaml

# 6. Watch it converge
kubectl -n argocd get applications -w
```

> Images are private on GHCR by default. Either make the packages public or
> create a pull secret and reference it from the workload ServiceAccounts.

---

## Operations runbook

| Task | How |
| --- | --- |
| **Deploy a code change** | Merge to `main`. CI builds + pushes the image and pins the tag; ArgoCD syncs automatically. |
| **Roll back** | `git revert` the tag-pin commit (or the feature commit). ArgoCD reconciles to the previous tag. |
| **Pin/override an image** | Edit `newTag` in `gitops/apps/voltage-drop-sim/overlays/kind/kustomization.yaml` and push. |
| **Add a new application** | Drop a new `Application` manifest in `gitops/argo-apps/` and push. |
| **Remove an application** | Delete its file in `gitops/argo-apps/`; the root prunes the Application and (via the finalizer) its workloads. |
| **Force a sync** | `argocd app sync <name>` or `kubectl -n argocd annotate app <name> argocd.argoproj.io/refresh=hard --overwrite`. |
| **Inspect drift** | `kubectl -n argocd get applications` (`OutOfSync` = Git ≠ cluster). |
| **Change monitoring versions** | Edit the chart `targetRevision` in the relevant `gitops/argo-apps/*.yaml`. |
| **Add a dashboard** | Drop the JSON in `gitops/platform/monitoring/dashboards/`; the sidecar picks it up. |

**Note on ordering:** the app-of-apps creates Applications, but does not wait
for one to finish before starting the next. Cross-app dependencies (e.g. CRDs
before the custom resources that use them) can therefore race; ArgoCD retries,
and `argocd.argoproj.io/sync-wave` annotations can enforce ordering when needed.

---

## Notes and limitations

- The frontend test suite is not yet CI-ready; the build is the gate.
- `docker-compose.yaml` and the Kubernetes manifests are kept in sync by hand;
  Compose is for local iteration, the cluster is the deployed model.
- The kind overlay is the only environment overlay today; adding another
  (e.g. staging) is a matter of a new `overlays/<env>/` directory and its own
  Application.
