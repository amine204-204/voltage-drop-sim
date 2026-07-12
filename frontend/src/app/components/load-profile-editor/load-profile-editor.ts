import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SplinePoint {
  x: number; // 0 to 100 (represents time %)
  y: number; // 0 to 100 (represents load %)
}

@Component({
  selector: 'app-load-profile-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './load-profile-editor.html',
  styleUrl: './load-profile-editor.scss'
})
export class LoadProfileEditor implements AfterViewInit {
  
  @Input() totalSteps: number = 10;
  @Input() maxLoadValue: number = 100;
  @Input() initialProfile: number[] = [];
  @Input() initialControlPoints: SplinePoint[] | null = null;

  @Input() loadUnit: string = 'A';
  @Output() onSave = new EventEmitter<{ profile: number[]; controlPoints: SplinePoint[] }>();
  @Output() onClose = new EventEmitter<void>();

  // Start with a flat line at 0% load
  public points: SplinePoint[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 }
  ];

  private absoluteValues: number[] = [0, 0]; 

  public isDragging: boolean = false;
  public dragIndex: number = -1;

   public svgPath: string = '';
  // NEW: Dynamic radii to keep points perfectly round regardless of window stretch
  public pointRadiusX: number = 0;
  public pointRadiusY: number = 0;

  constructor() {
    this.updateCurve();
  }

  ngAfterViewInit() {
    
    setTimeout(() => {
      this.updatePointRadius();
    }, 0);
    this.updateCurve();
  }

  
ngOnChanges() {
  console.log('LoadProfileControlPoints:', this.initialControlPoints);
  if (this.initialControlPoints && this.initialControlPoints.length > 0) {
    this.points = this.initialControlPoints.map(p => ({ ...p }));
    this.absoluteValues = this.points.map(p => p.y);
  } else {
    this.absoluteValues = (this.initialProfile && this.initialProfile.length > 0)
      ? [...this.initialProfile]
      : [0, 0];

    this.points = this.absoluteValues.map((val, i) => ({
      x: this.absoluteValues.length <= 1 ? 0 : (i / (this.absoluteValues.length - 1)) * 100,
      y: val
    }));
  }

  const initialMax = Math.max(...this.points.map(p => p.y), 10);
  if (this.maxLoadValue < initialMax) {
    this.maxLoadValue = initialMax;
  }

  this.updatePointRadius();
  this.updateCurve();
}

  // NEW: Recalculate when window resizes
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

  @ViewChild('svgCanvas') svgCanvas!: ElementRef;
  
  @HostListener('window:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
    if (!this.isDragging || this.dragIndex === -1) return;

    const rect = this.svgCanvas.nativeElement.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = 100 - (((event.clientY - rect.top) / rect.height) * 100);

    let absoluteY = (y / 100) * this.maxLoadValue;
    absoluteY = Math.max(0, absoluteY); // Load can't be negative

    if (y > 100) {
      // Grow the scale so dragging above the canvas raises the ceiling
      this.maxLoadValue += Math.ceil((-event.movementY) / 10);
    }

    this.absoluteValues[this.dragIndex] = absoluteY;

    const prevX = this.dragIndex > 0 ? this.points[this.dragIndex - 1].x : 0;
    const nextX = this.dragIndex < this.points.length - 1 ? this.points[this.dragIndex + 1].x : 100;

    const minAllowedX = prevX + 0.1;
    const maxAllowedX = nextX - 0.1;
    x = Math.max(minAllowedX, Math.min(maxAllowedX, x));

    this.points[this.dragIndex] = { x, y: absoluteY }; // <-- absoluteY, not raw y
    this.updateCurve();
  }

  @HostListener('window:mouseup')
  public onMouseUp() {
    this.isDragging = false;
    this.dragIndex = -1;
  }

  private updateCurve() {
    const densePoints = this.generateClampedCatmullRom();
    const scale = this.maxLoadValue > 0 ? this.maxLoadValue : 1;
    this.svgPath = densePoints
      .map(p => `${p.x},${100 - (p.y / scale) * 100}`)
      .join(' ');
  }

  private generateClampedCatmullRom(): {x: number, y: number}[] {
    const pts = this.points;
    if (pts.length < 2) return pts;
    
    const result: {x: number, y: number}[] = [];
    const n = pts.length;

    // SAFETY: Prevent division by zero if maxLoadValue is ever 0
    const scale = this.maxLoadValue > 0 ? this.maxLoadValue : 1;

    // Step through the X-axis in tiny increments
    for (let x = pts[0].x; x <= pts[n-1].x; x += 0.5) {
      
      // Find which segment we are currently on
      let segment = 0;
      for (let i = 0; i < n - 1; i++) {
        if (x >= pts[i].x && x <= pts[i+1].x) {
          segment = i;
          break;
        }
      }

      const p0 = pts[Math.max(segment - 1, 0)];
      const p1 = pts[segment];
      const p2 = pts[segment + 1];
      const p3 = pts[Math.min(segment + 2, n - 1)];

      // Get the 4 absolute Y values needed for Catmull-Rom (clamping edges to the first/last points)
      const p0y = pts[Math.max(segment - 1, 0)].y;
      const p1y = pts[segment].y;
      const p2y = pts[segment + 1].y;
      const p3y = pts[Math.min(segment + 2, n - 1)].y;

      // X-axis tangents (Time % remains unchanged)
      const m1x = (p2.x - p0.x) / 2;
      const m2x = (p3.x - p1.x) / 2;

      // Y-axis tangents: Normalize absolute values to a 0-1 scale relative to current maxLoadValue
      // This allows the curve to handle values > 100% and dynamic scale shifting
      const m1y = (p2y - p0y) / (2 * scale);
      const m2y = (p3y - p1y) / (2 * scale);

      // Generate Bezier control points
      let cp1x = p1.x + (m1x / 3);
      let cp1y = (p1y / scale) + (m1y / 3); // Normalize p1 to 0-1 scale, add tangent
      let cp2x = p2.x - (m2x / 3);
      let cp2y = (p2y / scale) - (m2y / 3); // Normalize p2 to 0-1 scale, subtract tangent

      // THE CLAMP: Prevent X-axis loops! Force handles to stay between the two anchor points.
      cp1x = Math.max(p1.x + 0.1, Math.min(p2.x - 0.1, cp1x));
      cp2x = Math.max(p1.x + 0.1, Math.min(p2.x - 0.1, cp2x));

      // Standard Cubic Bezier evaluation math
      const dx = p2.x - p1.x;
      const t = dx === 0 ? 0 : (x - p1.x) / dx;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      // Evaluate Bezier (result is a normalized 0-1+ percentage)
      const y_pu = mt3 * (p1y / scale) + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * (p2y / scale);
      
      // Convert the normalized percentage back into an absolute value (Amps/Watts)
      const absoluteY = y_pu * scale;
      
      // Add to our dense point array. 
      // (We clamp absolute Y to 0 just to be safe, though negative values draw fine in SVG)
      result.push({ x: x, y: Math.max(0, absoluteY) }); 
    }
    return result;
  }

  private evaluateSplineAtX(targetX: number): number {
    let closest = 0; 
    let minDistance = Infinity;
    const dense = this.generateClampedCatmullRom();
    
    for (const pt of dense) {
      const dist = Math.abs(pt.x - targetX);
      if (dist < minDistance) {
        minDistance = dist;
        closest = pt.y;
      }
    }
    return closest;
  }

  public addPoint(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName === 'circle' || (event.target as HTMLElement).tagName === 'rect') return;
    const rect = this.svgCanvas.nativeElement.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = 100 - (((event.clientY - rect.top) / rect.height) * 100);
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, y);
    if (y > 100) {
      const newMax = Math.ceil(y / 10) * 10;
      if (newMax > this.maxLoadValue) {
        this.maxLoadValue = newMax;
      }
    }
    
    let inserted = false;
    for (let i = 0; i < this.points.length - 1; i++) {
      if (x > this.points[i].x && x < this.points[i+1].x) {
        this.points.splice(i + 1, 0, { x, y });
        inserted = true;
        break;
      }
    }
    if (!inserted) return; 
    this.updateCurve();
  }

  public removePoint(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    if (this.points.length <= 2) return;
    this.points.splice(index, 1);
    this.updateCurve();
  }

  public applyAndClose() {
    const dense = this.generateClampedCatmullRom();
    const lastIndex = Math.max(this.totalSteps - 1, 1);

    const finalArray: number[] = [];
    for (let i = 0; i < this.totalSteps; i++) {
      const targetX = (i / lastIndex) * 100;
      let closest = dense[0]?.y ?? 0;
      let minDistance = Infinity;
      for (const pt of dense) {
        const dist = Math.abs(pt.x - targetX);
        if (dist < minDistance) {
          minDistance = dist;
          closest = pt.y;
        }
      }
      finalArray.push(closest);
    }

    console.log('Final Load Profile Array:', finalArray);
    this.onSave.emit({ profile: finalArray, controlPoints: [...this.points] });
  }


    // --- REPLACE the old xGridLines getter with this ---
  public get xGridData(): { percent: number, step: number }[] {
    const data = [];
    const maxVisualLines = 20; // Max labels to show before skipping
    const stepIncrement = Math.max(1, Math.ceil(this.totalSteps / maxVisualLines));

    for (let i = 0; i < this.totalSteps; i += stepIncrement) {
      // Map step index (0 to N) to percentage (0 to 100)
      const percent = this.totalSteps === 1 ? 0 : (i / (this.totalSteps - 1)) * 100;
      data.push({ percent, step: i });
    }

    // Always ensure the very last step (100%) is included
    const lastStep = this.totalSteps - 1;
    if (data.length === 0 || data[data.length - 1].step !== lastStep) {
      data.push({ percent: 100, step: lastStep });
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

  public getScreenY(point: SplinePoint): number {
    const scale = this.maxLoadValue > 0 ? this.maxLoadValue : 1;
    return (point.y / scale) * 100;
  }
}