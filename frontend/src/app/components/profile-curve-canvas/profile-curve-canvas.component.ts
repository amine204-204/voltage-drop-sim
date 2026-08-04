import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { getCssVar } from '../../services/theme.service';
import { formatNum } from '../../shared/utils/format.utils';

/* ControlPoint in absolute values (time, value), not percentages or step indices */
/* Control point times are user/preset-authored and absolute — kept points are never rewritten to fit the sim axis */
export interface ControlPoint {
  time: number;
  value: number;
}

@Component({
  selector: 'app-profile-curve-canvas',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './profile-curve-canvas.component.html',
  styleUrl: './profile-curve-canvas.component.scss'
})
export class ProfileCurveCanvas implements AfterViewInit, OnChanges {

  public accentFill: string = 'rgba(232, 163, 61, 0.12)';

  @Input() set initialPoints(points: ControlPoint[]) {
    this.points = (points ?? []).map(p => ({ ...p }));
    this.updateCurve();
  }
  @Input() totalDuration: number = 1;
  @Input() maxLoadValue: number = 100;
  @Input() loadUnit: string = 'A';
  @Input() readOnly: boolean = false;

  @Output() pointsChange = new EventEmitter<ControlPoint[]>();

  public points: ControlPoint[] = [];
  public scaleMax: number = 100;

  public isDragging: boolean = false;
  public dragIndex: number = -1;

  public svgPath: string = '';

  public pointRadiusX: number = 0;
  public pointRadiusY: number = 0;

  @ViewChild('svgCanvas') svgCanvas!: ElementRef;

  constructor() {
    this.updateCurve();
    this.readAccentFill();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['maxLoadValue']) {
      this.scaleMax = Math.max(this.scaleMax, changes['maxLoadValue'].currentValue);
    }
    this.updateCurve();
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

  private timeToScreenX(time: number): number {
    return (time / this.totalDuration) * 100;
  }

  private screenXToTime(xPct: number): number {
    return (xPct / 100) * this.totalDuration;
  }

  private valueToScreenY(value: number): number {
    const scale = this.scaleMax > 0 ? this.scaleMax : 1;
    return (value / scale) * 100;
  }

  private screenYToValue(yPct: number): number {
    const scale = this.scaleMax > 0 ? this.scaleMax : 1;
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
    if (this.readOnly) return;
    event.preventDefault();
    this.isDragging = true;
    this.dragIndex = index;
  }

  @HostListener('window:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
    if (this.readOnly || !this.isDragging || this.dragIndex === -1) return;

    const rect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = 100 - (((event.clientY - rect.top) / rect.height) * 100);

    if (yPct > 100) {
      this.scaleMax += Math.ceil((-event.movementY) / 10);
    }

    const value = Math.max(0, this.screenYToValue(yPct));

    const prevTime = this.dragIndex > 0 ? this.points[this.dragIndex - 1].time : 0;
    const nextTime = this.dragIndex < this.points.length - 1
      ? this.points[this.dragIndex + 1].time
      : this.totalDuration;

    const epsilon = this.totalDuration * 0.001;
    const minTime = prevTime + epsilon;
    const maxTime = nextTime - epsilon;
    const time = Math.max(minTime, Math.min(maxTime, this.screenXToTime(xPct)));

    this.points[this.dragIndex] = { time, value };

    this.updateCurve();
  }

  @HostListener('window:mouseup')
  public onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragIndex = -1;
      this.emitPoints();
    } else {
      this.isDragging = false;
      this.dragIndex = -1;
    }
  }

  private updateCurve() {
    this.svgPath = ProfileCurveCanvas.buildSplinePath(this.points, this.scaleMax, this.totalDuration);
  }

  /* y is a clamped Catmull-Rom spline in time; the path uses cubic Bezier segments whose x is linear in t.
     The curve holds its first/last value forever beyond the endpoints, so the path is drawn flat from the
     left edge to the first point and from the last point to the right edge. */
  private static buildSplinePath(points: ControlPoint[], maxLoadValue: number, totalDuration: number): string {
    if (points.length < 2) return '';

    const scale = maxLoadValue > 0 ? maxLoadValue : 1;
    const screenX = (time: number) => (time / totalDuration) * 100;
    const screenY = (value: number) => 100 - (value / scale) * 100;

    const first = points[0];
    const last = points[points.length - 1];

    let d = `M 0,${screenY(first.value)} L ${screenX(first.time)},${screenY(first.value)}`;
    for (let i = 1; i < points.length; i++) {
      const { p1, p2, cp1y, cp2y } = ProfileCurveCanvas.getSegmentControlPoints(points, i - 1);
      const x1 = screenX(p1.time);
      const x2 = screenX(p2.time);
      const cp1x = x1 + (x2 - x1) / 3;
      const cp2x = x1 + (2 * (x2 - x1)) / 3;
      d += ` C ${cp1x},${screenY(cp1y)} ${cp2x},${screenY(cp2y)} ${x2},${screenY(p2.value)}`;
    }
    d += ` L 100,${screenY(last.value)}`;
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
    if (this.readOnly) return;
    if ((event.target as HTMLElement).tagName === 'rect') return;

    const rect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const yPct = 100 - (((event.clientY - rect.top) / rect.height) * 100);

    if (yPct > 100) {
      const newMax = Math.ceil(this.screenYToValue(yPct) / 10) * 10;
      if (newMax > this.scaleMax) {
        this.scaleMax = newMax;
      }
    }
    const value = Math.max(0, this.screenYToValue(yPct));
    const time = Math.max(0, Math.min(this.totalDuration, this.screenXToTime(xPct)));

    let inserted = false;
    for (let i = 0; i < this.points.length - 1; i++) {
      if (time > this.points[i].time && time < this.points[i + 1].time) {
        this.points.splice(i + 1, 0, { time, value });
        inserted = true;
        break;
      }
    }
    if (!inserted) return;

    this.updateCurve();
    this.emitPoints();
  }

  public removePoint(event: MouseEvent, index: number) {
    if (this.readOnly) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.points.length <= 2) return;
    if (index === 0 || index === this.points.length - 1) return;
    this.points.splice(index, 1);

    this.updateCurve();
    this.emitPoints();
  }

  private emitPoints() {
    this.pointsChange.emit(this.points.map(p => ({ ...p })));
  }

  public formatTime(seconds: number): string {
    if (this.totalDuration >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.round((seconds % 3600) / 60);
      return m === 60 ? `${h + 1}:00` : `${h}:${m.toString().padStart(2, '0')}`;
    }
    if (this.totalDuration >= 60) {
      const m = Math.floor(seconds / 60);
      const s = Math.round(seconds % 60);
      return s === 60 ? `${m + 1}:00` : `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `${seconds} s`;
  }

  public get xGridData(): { percent: number, instant: number }[] {
    const maxVisualLines = 12;
    const stepCandidates = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 21600, 43200, 86400];
    const step = stepCandidates.find(s => this.totalDuration / s <= maxVisualLines) ?? this.totalDuration;

    const data: { percent: number, instant: number }[] = [];
    for (let t = 0; t <= this.totalDuration + step / 2; t += step) {
      const instant = Math.min(t, this.totalDuration);
      data.push({ percent: this.timeToScreenX(instant), instant });
    }

    if (data.length === 0 || data[data.length - 1].instant !== this.totalDuration) {
      data.push({ percent: 100, instant: this.totalDuration });
    }

    return data;
  }

  public get yGridData(): { percent: number, label: string }[] {
    const max = this.scaleMax;
    return [
      { percent: 0, label: `0 ${this.loadUnit}` },
      { percent: 25, label: `${formatNum(max * 0.25)} ${this.loadUnit}` },
      { percent: 50, label: `${formatNum(max * 0.5)} ${this.loadUnit}` },
      { percent: 75, label: `${formatNum(max * 0.75)} ${this.loadUnit}` },
      { percent: 100, label: `${formatNum(max)} ${this.loadUnit}` }
    ];
  }
}
