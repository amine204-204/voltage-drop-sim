import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { IconComponent } from '../shared/icon/icon.component';
import { formatNum } from '../../shared/utils/format.utils';
import { AffectedNode, CableSizingSuggestion, PathBranch } from '../../models/simulation.model';

export interface ReportIssue {
  nodeId: string;
  nodeName: string;
  classification: string;
  startTimeStep: number;
  endTimeStep: number;
  worstMagnitudePu: number;
  pathBranches: PathBranch[];
}

/* A selectable cable size for a suggestion card: the recommended size plus its larger alternatives. */
export interface SizingOption {
  catalogId: string;
  crossSection: string;
  predictedTotalDropPercent: number;
  isRecommended: boolean;
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  INSTANTANEOUS_SAG: 'Instantaneous sag',
  MOMENTARY_SAG: 'Momentary sag',
  TEMPORARY_SAG: 'Temporary sag',
  SUSTAINED_UNDERVOLTAGE: 'Sustained undervoltage',
  INTERRUPTION: 'Interruption'
};

const SEVERE_CLASSIFICATIONS = ['SUSTAINED_UNDERVOLTAGE', 'INTERRUPTION', 'TEMPORARY_SAG'];

@Component({
  selector: 'app-simulation-report-panel',
  standalone: true,
  imports: [NgFor, NgIf, IconComponent],
  templateUrl: './simulation-report-panel.component.html',
  styleUrl: './simulation-report-panel.component.scss'
})
export class SimulationReportPanel {

  @Input() issues: ReportIssue[] = [];
  @Input() deltaTime: number = 1;
  @Input() stale: boolean = false;
  @Input() cableSuggestions: CableSizingSuggestion[] = [];
  @Input() suggesting: boolean = false;
  @Input() appliedBranchIds: string[] = [];

  @Output() issueClicked = new EventEmitter<ReportIssue>();
  @Output() suggestClicked = new EventEmitter<void>();
  @Output() suggestionClicked = new EventEmitter<CableSizingSuggestion>();
  @Output() applySuggestion = new EventEmitter<CableSizingSuggestion>();
  @Output() close = new EventEmitter<void>();

  public labelFor(classification: string): string {
    return CLASSIFICATION_LABELS[classification] || classification;
  }

  public isSevere(classification: string): boolean {
    return SEVERE_CLASSIFICATIONS.includes(classification);
  }

  public magnitudePercent(issue: ReportIssue): string {
    const deviation = (1 - issue.worstMagnitudePu) * 100;
    return formatNum(Math.max(deviation, 0));
  }

  public timeRangeSeconds(issue: ReportIssue): string {
    const start = issue.startTimeStep * this.deltaTime;
    const end = (issue.endTimeStep + 1) * this.deltaTime;
    return `${formatNum(start)}s – ${formatNum(end)}s`;
  }

  /* Source→node chain of branches causing the violation at this connection point. */
  public pathLabel(issue: ReportIssue): string {
    const names = (issue.pathBranches || []).map(pb => pb.branchName || pb.branchId);
    return names.length > 0 ? names.join(' → ') : 'direct feed';
  }

  public branchLabel(suggestion: CableSizingSuggestion): string {
    return suggestion.branchName || suggestion.branchId;
  }

  public affectedLabel(suggestion: CableSizingSuggestion): string {
    const names = (suggestion.affectedNodes || [])
      .map(n => n.nodeName || n.nodeId)
      .filter((n, i, arr) => arr.indexOf(n) === i);
    return names.length > 0 ? names.join(', ') : '';
  }

  /* The affected node with the deepest drop — headline numbers in the card refer to it. */
  public referenceNode(suggestion: CableSizingSuggestion): AffectedNode | null {
    const nodes = suggestion.affectedNodes || [];
    if (nodes.length === 0) return null;
    return nodes.reduce((worst, n) => n.totalDropPercent > worst.totalDropPercent ? n : worst, nodes[0]);
  }

  public isApplied(suggestion: CableSizingSuggestion): boolean {
    return this.appliedBranchIds.includes(suggestion.branchId);
  }

  public formatNum(value: number): string {
    return formatNum(value);
  }

  /* === ALTERNATIVE SELECTION ===
     The backend recommends the smallest adequate size, but larger sizes (more margin) exist as
     alternatives. The engineer picks one; Apply uses the selection. Keyed by branchId. */
  private readonly selectedByBranch = new Map<string, string>();

  public options(suggestion: CableSizingSuggestion): SizingOption[] {
    const ref = this.referenceNode(suggestion);
    const options: SizingOption[] = [{
      catalogId: suggestion.suggestedCatalogId,
      crossSection: suggestion.suggestedCrossSection,
      predictedTotalDropPercent: ref?.predictedTotalDropPercent ?? suggestion.dropReductionPercent,
      isRecommended: true
    }];
    for (const alt of suggestion.alternatives || []) {
      options.push({
        catalogId: alt.catalogId,
        crossSection: alt.crossSection,
        predictedTotalDropPercent: alt.predictedTotalDropPercent,
        isRecommended: false
      });
    }
    return options;
  }

  public selectedCatalogId(suggestion: CableSizingSuggestion): string {
    return this.selectedByBranch.get(suggestion.branchId) ?? suggestion.suggestedCatalogId;
  }

  public selectOption(suggestion: CableSizingSuggestion, catalogId: string): void {
    this.selectedByBranch.set(suggestion.branchId, catalogId);
  }

  public targetLabel(suggestion: CableSizingSuggestion): string {
    const chosen = this.options(suggestion).find(o => o.catalogId === this.selectedCatalogId(suggestion));
    return chosen ? chosen.crossSection : suggestion.suggestedCrossSection;
  }

  /* Applies the engineer's chosen size (recommended or alternative), not just the default. */
  public emitApply(suggestion: CableSizingSuggestion): void {
    const chosen = this.options(suggestion).find(o => o.catalogId === this.selectedCatalogId(suggestion));
    if (!chosen || chosen.catalogId === suggestion.suggestedCatalogId) {
      this.applySuggestion.emit(suggestion);
      return;
    }
    const alt = (suggestion.alternatives || []).find(a => a.catalogId === chosen.catalogId);
    this.applySuggestion.emit({
      ...suggestion,
      suggestedCatalogId: chosen.catalogId,
      suggestedCrossSection: chosen.crossSection,
      suggestedName: alt?.name
    });
  }
}
