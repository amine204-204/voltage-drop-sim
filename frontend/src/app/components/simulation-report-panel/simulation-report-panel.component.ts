import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { IconComponent } from '../shared/icon/icon.component';
import { formatNum } from '../../shared/utils/format.utils';
import { PathBranch } from '../../models/simulation.model';

export interface ReportIssue {
  nodeId: string;
  nodeName: string;
  classification: string;
  startTimeStep: number;
  endTimeStep: number;
  worstMagnitudePu: number;
  pathBranches: PathBranch[];
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

  @Output() issueClicked = new EventEmitter<ReportIssue>();
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
}
