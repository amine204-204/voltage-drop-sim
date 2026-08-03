import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { ModalComponent } from '../shared/modal/modal.component';
import { getCssVar } from '../../services/theme.service';

/* ControlPoint in absolute values (time, value), not percentages or step indices */
/* Control point times are user/preset-authored and absolute — kept points are never rewritten to fit the sim axis */
export interface ControlPoint {
  time: number;
  value: number;
}

@Component({
  selector: 'app-load-profile-editor',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, ModalComponent],
  templateUrl: './load-profile-editor.component.html',
  styleUrl: './load-profile-editor.component.scss'
})
export class LoadProfileEditor implements AfterViewInit {

  public accentFill: string = 'rgba(232, 163, 61, 0.12)';

  @Input() totalSteps: number = 10;
  @Input() deltaTime: number = 1; // seconds per step
  @Input() maxLoadValue: number = 100;
  @Input() initialProfile: number[] = [];
  @Input() initialControlPoints: ControlPoint[] | null = null;
  @Input() loadUnit: string = 'A';

  @Output() save = new EventEmitter<{ profile: number[]; controlPoints: ControlPoint[] }>();
  @Output() close = new EventEmitter<void>();

  public points: ControlPoint[] = [
    { time: 0, value: 0 },
    { time: 9, value: 0 }
  ];

  public isDragging: boolean = false;
  public dragIndex: number = -1;

  /* Full (unclipped) points as loaded. Stored curves are always the full, authored profile;
     edits are merged back on top of the untouched tail so the sim duration never destroys data. */
  private originalPoints: ControlPoint[] | null = null;
  private isDirty: boolean = false;

  public svgPath: string = '';

  public pointRadiusX: number = 0;
  public pointRadiusY: number = 0;

  @ViewChild('svgCanvas') svgCanvas!: ElementRef;

  constructor() {
    this.updateCurve();
    this.readAccentFill();
  }

  private readAccentFill() {
    this.accentFill = getCssVar('--accent-dim', this.accentFill);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updatePointRadius();
    }, 0);

    this.updateCurve();
  }

  ngOnChanges() {
    const totalDuration = this.getTotalDuration();

    if (this.initialControlPoints && this.initialControlPoints.length > 0) {
      this.originalPoints = this.initialControlPoints.map(p => ({ ...p }));
      this.points = LoadProfileEditor.clipControlPoints(this.initialControlPoints, totalDuration);
    } else if (this.initialProfile && this.initialProfile.length > 0) {
      this.points = this.initialProfile.map((value, i) => ({
        time: this.initialProfile.length <= 1 ? 0 : (i / (this.initialProfile.length - 1)) * totalDuration,
        value
      }));
      this.originalPoints = this.points.map(p => ({ ...p }));
    } else {
      this.points = [{ time: 0, value: 0 }, { time: totalDuration, value: 0 }];
      this.originalPoints = this.points.map(p => ({ ...p }));
    }
    this.isDirty = false;

    const initialMax = Math.max(...this.points.map(p => p.value), 10);
    if (this.maxLoadValue < initialMax) {
      this.maxLoadValue = initialMax;
    }

    this.updatePointRadius();
    this.updateCurve();
  }

  private getTotalDuration(): number {
    return Math.max((this.totalSteps - 1) * this.deltaTime, 0.0001);
  }

  private timeToScreenX(time: number): number {
    return (time / this.getTotalDuration()) * 100;
  }

  private screenXToTime(xPct: number): number {
    return (xPct / 100) * this.getTotalDuration();
  }

  private valueToScreenY(value: number): number {
    const scale = this.maxLoadValue > 0 ? this.maxLoadValue : 1;
    return (value / scale) * 100;
  }

  private screenYToValue(yPct: number): number {
    const scale = this.maxLoadValue > 0 ? this.maxLoadValue : 1;
    return (yPct / 100) * scale;
  }

  public getScreenX(point: ControlPoint): number {
    return this.timeToScreenX(point.time);
  }

  public getScreenY(point: ControlPoint): number {
    return this.valueToScreenY(point.value);
  }

  @HostListener('window:resize')
  onResize() {
    this.updatePointRadius();
  }

  private updatePointRadius() {
    if (!this.svgCanvas) return;
    const rect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const targetScreenRadius = 6;
    this.pointRadiusX = (targetScreenRadius / rect.width) * 100;
    this.pointRadiusY = (targetScreenRadius / rect.height) * 100;
  }

  public onPointMouseDown(event: MouseEvent, index: number) {
    event.preventDefault();
    this.isDragging = true;
    this.dragIndex = index;
  }

  @HostListener('window:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
    if (!this.isDragging || this.dragIndex === -1) return;

    const rect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = 100 - (((event.clientY - rect.top) / rect.height) * 100);

    if (yPct > 100) {
      this.maxLoadValue += Math.ceil((-event.movementY) / 10);
    }

    const value = Math.max(0, this.screenYToValue(yPct));

    const isEndpoint = this.dragIndex === 0 || this.dragIndex === this.points.length - 1;
    const prevTime = this.dragIndex > 0 ? this.points[this.dragIndex - 1].time : 0;
    const nextTime = this.dragIndex < this.points.length - 1
      ? this.points[this.dragIndex + 1].time
      : this.getTotalDuration();

    const epsilon = this.getTotalDuration() * 0.001;
    const minTime = prevTime + epsilon;
    const maxTime = nextTime - epsilon;
    const time = isEndpoint
      ? this.points[this.dragIndex].time
      : Math.max(minTime, Math.min(maxTime, this.screenXToTime(xPct)));

    this.points[this.dragIndex] = { time, value };
    this.isDirty = true;

    this.updateCurve();
  }

  @HostListener('window:mouseup')
  public onMouseUp() {
    this.isDragging = false;
    this.dragIndex = -1;
  }

  private updateCurve() {
    this.svgPath = LoadProfileEditor.buildSplinePath(this.points, this.maxLoadValue, this.getTotalDuration());
  }

  /* y is a clamped Catmull-Rom spline in time; the path uses cubic Bezier segments whose x is linear in t */
  private static buildSplinePath(points: ControlPoint[], maxLoadValue: number, totalDuration: number): string {
    if (points.length < 2) return '';

    const scale = maxLoadValue > 0 ? maxLoadValue : 1;
    const screenX = (time: number) => (time / totalDuration) * 100;
    const screenY = (value: number) => 100 - (value / scale) * 100;

    let d = `M ${screenX(points[0].time)},${screenY(points[0].value)}`;
    for (let i = 1; i < points.length; i++) {
      const { p1, p2, cp1y, cp2y } = LoadProfileEditor.getSegmentControlPoints(points, i - 1);
      const x1 = screenX(p1.time);
      const x2 = screenX(p2.time);
      const cp1x = x1 + (x2 - x1) / 3;
      const cp2x = x1 + (2 * (x2 - x1)) / 3;
      d += ` C ${cp1x},${screenY(cp1y)} ${cp2x},${screenY(cp2y)} ${x2},${screenY(p2.value)}`;
    }
    return d;
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

  public addPoint(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName === 'rect') return;

    const rect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const yPct = 100 - (((event.clientY - rect.top) / rect.height) * 100);

    if (yPct > 100) {
      const newMax = Math.ceil(this.screenYToValue(yPct) / 10) * 10;
      if (newMax > this.maxLoadValue) {
        this.maxLoadValue = newMax;
      }
    }
    const value = Math.max(0, this.screenYToValue(yPct));
    const time = Math.max(0, Math.min(this.getTotalDuration(), this.screenXToTime(xPct)));

    let inserted = false;
    for (let i = 0; i < this.points.length - 1; i++) {
      if (time > this.points[i].time && time < this.points[i + 1].time) {
        this.points.splice(i + 1, 0, { time, value });
        inserted = true;
        break;
      }
    }
    if (!inserted) return;

    this.isDirty = true;
    this.updateCurve();
  }

  public removePoint(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    if (this.points.length <= 2) return;
    if (index === 0 || index === this.points.length - 1) return;
    this.points.splice(index, 1);

    this.isDirty = true;
    this.updateCurve();
  }

  public applyAndClose() {
    const source = this.isDirty
      ? LoadProfileEditor.mergeEditedPoints(this.points, this.originalPoints ?? this.points, this.getTotalDuration())
      : (this.originalPoints ?? this.points);
    const profile = LoadProfileEditor.getProfileFromControlPoints(source, this.totalSteps, this.deltaTime, this.maxLoadValue);
    this.save.emit({ profile, controlPoints: source.map(p => ({ ...p })) });
  }

  public get xGridData(): { percent: number, instant: number }[] {
    const data = [];
    const maxVisualLines = 20;
    const stepIncrement = Math.max(1, Math.ceil(this.totalSteps / maxVisualLines));

    for (let i = 0; i < this.totalSteps; i += stepIncrement) {
      const instant = i * this.deltaTime;
      data.push({ percent: this.timeToScreenX(instant), instant });
    }

    const lastInstant = (this.totalSteps - 1) * this.deltaTime;
    if (data.length === 0 || data[data.length - 1].instant !== lastInstant) {
      data.push({ percent: 100, instant: lastInstant });
    }

    return data;
  }

  public get yGridData(): { percent: number, label: string }[] {
    const max = this.maxLoadValue;
    return [
      { percent: 0, label: `0 ${this.loadUnit}` },
      { percent: 25, label: `${(max * 0.25).toFixed(1)} ${this.loadUnit}` },
      { percent: 50, label: `${(max * 0.5).toFixed(1)} ${this.loadUnit}` },
      { percent: 75, label: `${(max * 0.75).toFixed(1)} ${this.loadUnit}` },
      { percent: 100, label: `${max.toFixed(1)} ${this.loadUnit}` }
    ];
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