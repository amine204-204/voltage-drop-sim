import { Core } from 'cytoscape';

interface Point { x: number; y: number; }

function quadPt(p0: Point, p1: Point, p2: Point, t: number): Point {
    const m = 1 - t;
    return {
        x: m * m * p0.x + 2 * m * t * p1.x + t * t * p2.x,
        y: m * m * p0.y + 2 * m * t * p1.y + t * t * p2.y
    };
}

function getEdgeBezier(edge: any): { p0: Point; p1: Point; p2: Point } | null {
    const src = edge.sourceEndpoint();
    const tgt = edge.targetEndpoint();
    if (!src || !tgt) return null;

    const p0 = { x: src.x, y: src.y };
    const p2 = { x: tgt.x, y: tgt.y };

    let cps: any[] = [];
    try { cps = edge.controlPoints() || []; } catch { /* ignore */ }

    const p1 = cps.length > 0
        ? { x: cps[0].x, y: cps[0].y }
        : { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 };

    return { p0, p1, p2 };
}

function sampleBezier(p0: Point, p1: Point, p2: Point, segments = 60): { pt: Point; dist: number }[] {
    const out: { pt: Point; dist: number }[] = [{ pt: { ...p0 }, dist: 0 }];
    let acc = 0;
    let prev = p0;

    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const pos = quadPt(p0, p1, p2, t);
        acc += Math.hypot(pos.x - prev.x, pos.y - prev.y);
        out.push({ pt: pos, dist: acc });
        prev = pos;
    }
    return out;
}

function pointAtDist(samples: { pt: Point; dist: number }[], target: number): Point {
    for (let i = 0; i < samples.length - 1; i++) {
        const a = samples[i], b = samples[i + 1];
        if (target >= a.dist && target <= b.dist) {
            const t = (target - a.dist) / (b.dist - a.dist || 1);
            return { x: a.pt.x + t * (b.pt.x - a.pt.x), y: a.pt.y + t * (b.pt.y - a.pt.y) };
        }
    }
    return samples[samples.length - 1].pt;
}

function drawCurveSegment(
    ctx: CanvasRenderingContext2D,
    samples: { pt: Point; dist: number }[],
    fromDist: number,
    toDist: number
) {
    const start = pointAtDist(samples, fromDist);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);

    let drawing = false;
    for (const s of samples) {
        if (s.dist < fromDist) continue;
        if (s.dist > toDist) break;
        ctx.lineTo(s.pt.x, s.pt.y);
        drawing = true;
    }

    const end = pointAtDist(samples, toDist);
    ctx.lineTo(end.x, end.y);
    if (drawing) ctx.stroke();
}

const SYM_SCALE_BASE = 0.50;
const SYM_HALF_WIDTH = 55;
const MIN_LEN = 30;

function drawTransformer(
    ctx: CanvasRenderingContext2D,
    samples: { pt: Point; dist: number }[],
    totalLen: number,
    lineColor: string,
    isSelected: boolean,
    isActive: boolean
) {
    if (totalLen < MIN_LEN) return;

    const margin = 8;
    const maxReach = (totalLen / 2) - margin;
    const baseReach = SYM_HALF_WIDTH * SYM_SCALE_BASE;
    const scale = maxReach < baseReach ? maxReach / SYM_HALF_WIDTH : SYM_SCALE_BASE;
    const reach = SYM_HALF_WIDTH * scale;

    const half = totalLen / 2;
    const midSample = samples[Math.floor(samples.length / 2)];
    const before = pointAtDist(samples, half - 2);
    const after = pointAtDist(samples, half + 2);
    const angle = Math.atan2(after.y - before.y, after.x - before.x);
    const pos = midSample.pt;

    const strokeColor = isSelected ? '#E8A33D' : isActive ? '#F4B75A' : lineColor;
    const lineWidth = isSelected ? 4 : isActive ? 3.5 : 3;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    drawCurveSegment(ctx, samples, 0, half - reach);
    drawCurveSegment(ctx, samples, half + reach, totalLen);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3 / scale;
    ctx.strokeStyle = strokeColor;

    const R = 22;
    const gap = -10;
    const cx1 = -(R + gap / 2);
    const cx2 = (R + gap / 2);

    ctx.beginPath(); ctx.moveTo(-55, 0); ctx.lineTo(cx1 - R, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx2 + R, 0); ctx.lineTo(55, 0); ctx.stroke();

    ctx.beginPath(); ctx.arc(cx1, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx2, 0, R, 0, Math.PI * 2); ctx.stroke();

    ctx.restore();
}

function drawSwitch(
    ctx: CanvasRenderingContext2D,
    samples: { pt: Point; dist: number }[],
    totalLen: number,
    lineColor: string,
    closed: boolean,
    isSelected: boolean,
    isActive: boolean
) {
    if (totalLen < MIN_LEN) return;

    const margin = 8;
    const maxReach = (totalLen / 2) - margin;
    const baseReach = SYM_HALF_WIDTH * SYM_SCALE_BASE;
    const scale = maxReach < baseReach ? maxReach / SYM_HALF_WIDTH : SYM_SCALE_BASE;
    const reach = SYM_HALF_WIDTH * scale;

    const half = totalLen / 2;
    const midSample = samples[Math.floor(samples.length / 2)];
    const before = pointAtDist(samples, half - 2);
    const after = pointAtDist(samples, half + 2);
    const angle = Math.atan2(after.y - before.y, after.x - before.x);
    const pos = midSample.pt;

    const strokeColor = isSelected ? '#E8A33D' : isActive ? '#F4B75A' : lineColor;
    const lineWidth = isSelected ? 3.5 : isActive ? 3 : 2.5;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    drawCurveSegment(ctx, samples, 0, half - reach);
    drawCurveSegment(ctx, samples, half + reach, totalLen);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3 / scale;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;

    ctx.beginPath(); ctx.moveTo(-55, 0); ctx.lineTo(-15, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(55, 0); ctx.stroke();

    ctx.beginPath(); ctx.arc(-15, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, 0, 3.5, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath();
    if (closed) {
        ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
    } else {
        ctx.moveTo(-15, 0); ctx.lineTo(20, -22);
    }
    ctx.stroke();

    ctx.restore();
}

/* ── Robust context getter: tries Cytoscape internals, then DOM fallback ── */
function getCyCanvasContext(cy: Core): CanvasRenderingContext2D | null {
    const r = (cy as any).renderer?.();
    if (r) {
        const candidates = [
            r.data?.contexts?.[1],           // main layer (most common)
            r.data?.contexts?.[0],           // fallback
            r.data?.canvases?.[1]?.context,  // main canvas object
            r.data?.canvases?.[0]?.context,  // fallback
            r.data?.canvases?.find((c: any) => c.id === 'main')?.context,
        ];
        for (const ctx of candidates) {
            if (ctx instanceof CanvasRenderingContext2D) return ctx;
        }
    }

    // DOM fallback: pick the second canvas in the container (first is usually bg)
    const container = cy.container();
    if (!container) return null;
    const canvases = Array.from(container.querySelectorAll('canvas'));
    for (const canvas of canvases.slice(1)) {
        const ctx = canvas.getContext('2d');
        if (ctx) return ctx;
    }
    for (const canvas of canvases) {
        const ctx = canvas.getContext('2d');
        if (ctx) return ctx;
    }
    return null;
}

/* ── Overlay fallback (only used if direct context fails) ── */
function registerOverlayRenderer(cy: Core): (() => void) | null {
    const container = cy.container();
    if (!container) return null;

    if (window.getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    const overlay = document.createElement('canvas');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';
    container.appendChild(overlay);

    const ctx = overlay.getContext('2d');
    if (!ctx) return null;

    const dpr = () => window.devicePixelRatio || 1;

    const resize = () => {
        const rect = container.getBoundingClientRect();
        const ratio = dpr();
        overlay.width = rect.width * ratio;
        overlay.height = rect.height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = () => {
        const rect = container.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        const pan = cy.pan();
        const zoom = cy.zoom();
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        cy.edges().forEach((edge: any) => {
            if (!edge.visible()) return;
            const branchType = edge.data('branchType') || 'CABLE';
            if (branchType === 'CABLE') return;

            const bezier = getEdgeBezier(edge);
            if (!bezier) return;

            const samples = sampleBezier(bezier.p0, bezier.p1, bezier.p2);
            const totalLen = samples[samples.length - 1].dist;
            const lineColor = edge.style('line-color') || '#A3B1C6';
            const isSelected = edge.selected();
            const isActive = edge.active();

            ctx.strokeStyle = lineColor;
            ctx.fillStyle = lineColor;

            if (branchType === 'TRANSFORMER') {
                drawTransformer(ctx, samples, totalLen, lineColor, isSelected, isActive);
            } else if (branchType === 'SWITCH') {
                drawSwitch(ctx, samples, totalLen, lineColor, edge.data('closed') !== false, isSelected, isActive);
            }
        });

        ctx.restore();
    };

    cy.on('render', draw);

    return () => {
        ro.disconnect();
        overlay.remove();
        cy.removeListener('render', undefined, draw as any);
    };
}

export function registerEdgeSymbolRenderer(cy: Core): void {
    // Try direct canvas drawing first (no overlay, no flicker)
    const directCtx = getCyCanvasContext(cy);

    if (directCtx) {
        cy.on('render', () => {
            const pan = cy.pan();
            const zoom = cy.zoom();
            const dpr = window.devicePixelRatio || 1;

            directCtx.save();
            // Match Cytoscape's internal transform exactly:
            // canvas_coord = (model_coord * zoom + pan) * dpr
            directCtx.setTransform(zoom * dpr, 0, 0, zoom * dpr, pan.x * dpr, pan.y * dpr);

            cy.edges().forEach((edge: any) => {
                if (!edge.visible()) return;
                const branchType = edge.data('branchType') || 'CABLE';
                if (branchType === 'CABLE') return;

                const bezier = getEdgeBezier(edge);
                if (!bezier) return;

                const samples = sampleBezier(bezier.p0, bezier.p1, bezier.p2);
                const totalLen = samples[samples.length - 1].dist;
                const lineColor = edge.style('line-color') || '#A3B1C6';
                const isSelected = edge.selected();
                const isActive = edge.active();

                directCtx.strokeStyle = lineColor;
                directCtx.fillStyle = lineColor;

                if (branchType === 'TRANSFORMER') {
                    drawTransformer(directCtx, samples, totalLen, lineColor, isSelected, isActive);
                } else if (branchType === 'SWITCH') {
                    drawSwitch(directCtx, samples, totalLen, lineColor, edge.data('closed') !== false, isSelected, isActive);
                }
            });

            directCtx.restore();
        });
        return;
    }

    // Fallback to overlay if direct context unavailable
    const cleanup = registerOverlayRenderer(cy);
    if (cleanup) {
        cy.on('destroy', cleanup);
    }
}