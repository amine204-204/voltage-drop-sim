import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { ModalComponent } from '../shared/modal/modal.component';
import { getCssVar } from '../../services/theme.service';

/* ControlPoint in absolute values (time, value), not percentages or step indices */
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

    this.syncEndpoints();
    this.updateCurve();
  }

  ngOnChanges() {
    const totalDuration = this.getTotalDuration();

    if (this.initialControlPoints && this.initialControlPoints.length > 0) {
      this.points = this.initialControlPoints.map(p => ({ ...p }));
    } else if (this.initialProfile && this.initialProfile.length > 0) {
      this.points = this.initialProfile.map((value, i) => ({
        time: this.initialProfile.length <= 1 ? 0 : (i / (this.initialProfile.length - 1)) * totalDuration,
        value
      }));
    } else {
      this.points = [{ time: 0, value: 0 }, { time: totalDuration, value: 0 }];
    }

    const initialMax = Math.max(...this.points.map(p => p.value), 10);
    if (this.maxLoadValue < initialMax) {
      this.maxLoadValue = initialMax;
    }

    this.syncEndpoints();
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

  private syncEndpoints() {
    const n = this.points.length;
    if (n < 2) return;

    const totalDuration = this.getTotalDuration();
    this.points[0].time = 0;
    this.points[n - 1].time = totalDuration;

    if (n >= 3) {
      this.points[0].value = this.points[1].value;
      this.points[n - 1].value = this.points[n - 2].value;
    }
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
    if (index === 0 || index === this.points.length - 1) return;
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

    const prevTime = this.dragIndex > 0 ? this.points[this.dragIndex - 1].time : 0;
    const nextTime = this.dragIndex < this.points.length - 1
      ? this.points[this.dragIndex + 1].time
      : this.getTotalDuration();

    const epsilon = this.getTotalDuration() * 0.001;
    const minTime = prevTime + epsilon;
    const maxTime = nextTime - epsilon;
    const time = Math.max(minTime, Math.min(maxTime, this.screenXToTime(xPct)));

    this.points[this.dragIndex] = { time, value };

    this.syncEndpoints();
    this.updateCurve();
  }

  @HostListener('window:mouseup')
  public onMouseUp() {
    this.isDragging = false;
    this.dragIndex = -1;
  }

  private updateCurve() {
    const dense = LoadProfileEditor.generateClampedCatmullRom(this.points, this.maxLoadValue);
    this.svgPath = dense
      .map(p => `${this.timeToScreenX(p.time)},${100 - this.valueToScreenY(p.value)}`)
      .join(' ');
  }

  private static generateClampedCatmullRom(points: ControlPoint[], maxLoadValue: number): ControlPoint[] {
    const pts = points;
    if (pts.length < 2) return pts;

    const result: ControlPoint[] = [];
    const n = pts.length;
    const scale = maxLoadValue > 0 ? maxLoadValue : 1;

    const startTime = pts[0].time;
    const endTime = pts[n - 1].time;
    const samples = 200;
    const increment = (endTime - startTime) / samples || 1;

    for (let time = startTime; time <= endTime; time += increment) {

      let segment = 0;
      for (let i = 0; i < n - 1; i++) {
        if (time >= pts[i].time && time <= pts[i + 1].time) {
          segment = i;
          break;
        }
      }

      const p0 = pts[Math.max(segment - 1, 0)];
      const p1 = pts[segment];
      const p2 = pts[segment + 1];
      const p3 = pts[Math.min(segment + 2, n - 1)];

      const m1x = (p2.time - p0.time) / 2;
      const m2x = (p3.time - p1.time) / 2;

      const m1y = (p2.value - p0.value) / (2 * scale);
      const m2y = (p3.value - p1.value) / (2 * scale);

      let cp1x = p1.time + (m1x / 3);
      let cp1y = (p1.value / scale) + (m1y / 3);
      let cp2x = p2.time - (m2x / 3);
      let cp2y = (p2.value / scale) - (m2y / 3);

      const eps = (p2.time - p1.time) * 0.001 || 0.001;
      cp1x = Math.max(p1.time + eps, Math.min(p2.time - eps, cp1x));
      cp2x = Math.max(p1.time + eps, Math.min(p2.time - eps, cp2x));

      const dx = p2.time - p1.time;
      const t = dx === 0 ? 0 : (time - p1.time) / dx;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      const y_pu = mt3 * (p1.value / scale) + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * (p2.value / scale);
      const absoluteValue = y_pu * scale;

      result.push({ time, value: Math.max(0, absoluteValue) });
    }
    return result;
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

    this.syncEndpoints();
    this.updateCurve();
  }

  public removePoint(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    if (this.points.length <= 2) return;
    if (index === 0 || index === this.points.length - 1) return;
    this.points.splice(index, 1);

    this.syncEndpoints();
    this.updateCurve();
  }

  public applyAndClose() {
    const profile = LoadProfileEditor.getProfileFromControlPoints(this.points, this.totalSteps, this.deltaTime, this.maxLoadValue);
    this.save.emit({ profile, controlPoints: this.points.map(p => ({ ...p })) });
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

  public static getProfileFromControlPoints(points: ControlPoint[], totalSteps: number, deltaTime: number, maxLoadValue: number): number[] {
    const dense = LoadProfileEditor.generateClampedCatmullRom(points, maxLoadValue);
    const finalArray: number[] = [];

    for (let i = 0; i < totalSteps; i++) {
      const targetTime = i * deltaTime;
      let closest = dense[0]?.value ?? 0;
      let minDistance = Infinity;
      for (const pt of dense) {
        const dist = Math.abs(pt.time - targetTime);
        if (dist < minDistance) {
          minDistance = dist;
          closest = pt.value;
        }
      }
      finalArray.push(closest);
    }
    return finalArray;
  }
}