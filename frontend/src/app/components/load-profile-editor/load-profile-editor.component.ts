import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { NgIf } from '@angular/common';
import { ModalComponent } from '../shared/modal/modal.component';
import { ProfileCurveCanvas, ControlPoint } from '../profile-curve-canvas/profile-curve-canvas.component';

/* ControlPoint in absolute values (time, value), not percentages or step indices */
/* Control point times are user/preset-authored and absolute — kept points are never rewritten to fit the sim axis */
export type { ControlPoint } from '../profile-curve-canvas/profile-curve-canvas.component';

@Component({
  selector: 'app-load-profile-editor',
  standalone: true,
  imports: [ModalComponent, ProfileCurveCanvas, NgIf],
  templateUrl: './load-profile-editor.component.html',
  styleUrl: './load-profile-editor.component.scss'
})
export class LoadProfileEditor implements OnChanges {

  @Input() totalSteps: number = 10;
  @Input() deltaTime: number = 1; // seconds per step
  @Input() maxLoadValue: number = 100;
  @Input() initialProfile: number[] = [];
  @Input() initialControlPoints: ControlPoint[] | null = null;
  @Input() loadUnit: string = 'A';
  @Input() readOnly: boolean = false;

  @Output() save = new EventEmitter<{ profile: number[]; controlPoints: ControlPoint[] }>();
  @Output() close = new EventEmitter<void>();

  public totalDuration: number = 1;

  /* Clipped working set mirrored from the canvas (points within [0, totalDuration]) */
  public points: ControlPoint[] = [
    { time: 0, value: 0 },
    { time: 9, value: 0 }
  ];

  /* Full (unclipped) points as loaded. Stored curves are always the full, authored profile;
     edits are merged back on top of the untouched tail so the sim duration never destroys data. */
  private originalPoints: ControlPoint[] | null = null;
  private sourcePoints: ControlPoint[] | null = null;
  private isDirty: boolean = false;

  public baselineMaxLoadValue: number = 100;

  ngOnChanges() {
    this.totalDuration = this.getTotalDuration();

    if (this.initialControlPoints && this.initialControlPoints.length > 0) {
      this.originalPoints = this.initialControlPoints.map(p => ({ ...p }));
      this.points = LoadProfileEditor.clipControlPoints(this.initialControlPoints, this.totalDuration);
    } else if (this.initialProfile && this.initialProfile.length > 0) {
      this.points = this.initialProfile.map((value, i) => ({
        time: this.initialProfile.length <= 1 ? 0 : (i / (this.initialProfile.length - 1)) * this.totalDuration,
        value
      }));
      this.originalPoints = this.points.map(p => ({ ...p }));
    } else {
      this.points = [{ time: 0, value: 0 }, { time: this.totalDuration, value: 0 }];
      this.originalPoints = this.points.map(p => ({ ...p }));
    }
    this.isDirty = false;
    this.sourcePoints = null;

    const initialMax = Math.max(...this.points.map(p => p.value), 10);
    this.baselineMaxLoadValue = Math.max(this.maxLoadValue, initialMax);
  }

  private getTotalDuration(): number {
    return Math.max((this.totalSteps - 1) * this.deltaTime, 0.0001);
  }

  public onPointsChange(points: ControlPoint[]) {
    this.isDirty = true;
    this.points = points.map(p => ({ ...p }));
    this.sourcePoints = LoadProfileEditor.mergeEditedPoints(points, this.originalPoints ?? points, this.totalDuration);
  }

  public applyAndClose() {
    const source = this.isDirty
      ? (this.sourcePoints ?? this.points)
      : (this.originalPoints ?? this.points);
    const profile = LoadProfileEditor.getProfileFromControlPoints(source, this.totalSteps, this.deltaTime, this.maxLoadValue);
    this.save.emit({ profile, controlPoints: source.map(p => ({ ...p })) });
  }

  public static getProfileFromControlPoints(
    points: ControlPoint[],
    totalSteps: number,
    deltaTime: number,
    _maxLoadValue: number
  ): number[] {
    const finalArray: number[] = [];

    for (let i = 0; i < totalSteps; i++) {
      finalArray.push(LoadProfileEditor.sampleSpline(points, i * deltaTime));
    }
    return finalArray;
  }

  private static sampleSpline(points: ControlPoint[], time: number): number {
    if (points.length === 0) return 0;

    const first = points[0];
    const last = points[points.length - 1];
    if (time <= first.time) return Math.max(0, first.value);
    if (time >= last.time) return Math.max(0, last.value);

    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        const { p1, p2, cp1y, cp2y } = LoadProfileEditor.getSegmentControlPoints(points, i);
        const dx = p2.time - p1.time;
        const t = dx === 0 ? 0 : (time - p1.time) / dx;
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;

        const y = mt3 * p1.value + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * p2.value;
        return Math.max(0, y);
      }
    }
    return 0;
  }

  private static getSegmentControlPoints(
    points: ControlPoint[],
    segment: number
  ): { p1: ControlPoint; p2: ControlPoint; cp1y: number; cp2y: number } {
    const p0 = points[Math.max(segment - 1, 0)];
    const p1 = points[segment];
    const p2 = points[segment + 1];
    const p3 = points[Math.min(segment + 2, points.length - 1)];

    const m1 = (p2.value - p0.value) / 2;
    const m2 = (p3.value - p1.value) / 2;

    return { p1, p2, cp1y: p1.value + m1 / 3, cp2y: p2.value - m2 / 3 };
  }

  /* The sim duration is authoritative: drops control points past maxTime and, if the curve ends mid-segment,
     inserts a boundary point at maxTime sampled from the original spline so the chart ends exactly on the cut. */
  private static clipControlPoints(points: ControlPoint[], maxTime: number): ControlPoint[] {
    if (points.length < 2) return points.map(p => ({ ...p }));

    const kept: ControlPoint[] = [];
    for (const p of points) {
      if (p.time > maxTime) break;
      kept.push({ ...p });
    }

    const last = kept[kept.length - 1];
    let boundary: ControlPoint | null = null;
    if (last && last.time < maxTime) {
      boundary = { time: maxTime, value: LoadProfileEditor.sampleSpline(points, maxTime) };
    }

    const clipped = boundary ? [...kept, boundary] : kept;
    if (clipped.length >= 2) return clipped;

    const holdValue = boundary ? boundary.value : (kept[0]?.value ?? points[0].value);
    return [{ time: 0, value: holdValue }, { time: maxTime, value: holdValue }];
  }

  /* Keeps the user's edits within the visible window and splices the untouched original tail back on,
     so applying an edit never discards the portion of the curve beyond the current sim duration. */
  private static mergeEditedPoints(edited: ControlPoint[], original: ControlPoint[], totalDuration: number): ControlPoint[] {
    const tail = original.filter(p => p.time > totalDuration);
    if (tail.length === 0) return edited.map(p => ({ ...p }));

    const result = edited.map(p => ({ ...p }));
    if (tail[0].time === result[result.length - 1].time) {
      tail.shift();
    }
    return [...result, ...tail];
  }
}
