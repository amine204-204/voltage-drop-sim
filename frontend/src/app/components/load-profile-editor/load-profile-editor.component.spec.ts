import { describe, it, expect } from 'vitest';
import { LoadProfileEditor, ControlPoint } from './load-profile-editor.component';

describe('LoadProfileEditor.getProfileFromControlPoints', () => {
  it('returns array of correct length', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 9, value: 50 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result).toHaveLength(10);
  });

  it('returns all zeros for zero-value control points', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 9, value: 0 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result.every(v => v === 0)).toBe(true);
  });

  it('interpolates linearly between two control points', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 9, value: 100 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result[0]).toBeCloseTo(0, 0);
    expect(result[9]).toBeCloseTo(100, 0);
  });

  it('handles single step', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 42 },
      { time: 0, value: 42 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 1, 1, 100);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for zero totalSteps', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 9, value: 50 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 0, 1, 100);
    expect(result).toHaveLength(0);
  });

  it('handles flat profile (constant load)', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 50 },
      { time: 9, value: 50 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result.every(v => Math.abs(v - 50) < 5)).toBe(true);
  });

  it('handles three control points (peak in middle)', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 4.5, value: 100 },
      { time: 9, value: 0 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result).toHaveLength(10);
    const midIndex = Math.floor(result.length / 2);
    expect(result[midIndex]).toBeGreaterThan(result[0]);
  });

  it('preserves absolute preset endpoint values (point at last time step)', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 5 },
      { time: 3, value: 8 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
      { time: 18, value: 30 },
      { time: 22, value: 12 },
      { time: 24, value: 5 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 25, 1, 30);
    expect(result).toHaveLength(25);
    expect(result[0]).toBeCloseTo(5, 0);
    expect(result[24]).toBeCloseTo(5, 0);
    expect(result[24]).toBeLessThan(result[23]);
  });

  it('keeps preset control points absolute through load and apply', () => {
    const editor = new LoadProfileEditor();
    const preset: ControlPoint[] = [
      { time: 0, value: 5 },
      { time: 3, value: 8 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
      { time: 18, value: 30 },
      { time: 22, value: 12 },
      { time: 24, value: 5 },
    ];

    editor.totalSteps = 25;
    editor.deltaTime = 1;
    editor.maxLoadValue = 30;
    editor.initialControlPoints = preset;
    editor.ngOnChanges();

    let emitted: { profile: number[]; controlPoints: ControlPoint[] } | null = null;
    editor.save.subscribe(result => (emitted = result));
    editor.applyAndClose();

    expect(emitted).not.toBeNull();
    expect(emitted!.controlPoints[0]).toEqual({ time: 0, value: 5 });
    expect(emitted!.controlPoints[emitted!.controlPoints.length - 1]).toEqual({ time: 24, value: 5 });
    expect(emitted!.profile[0]).toBeCloseTo(5, 0);
    expect(emitted!.profile[24]).toBeCloseTo(5, 0);
  });

  it('clips preset control points to the sim duration on load', () => {
    const editor = new LoadProfileEditor();
    editor.totalSteps = 10;
    editor.deltaTime = 1;
    editor.maxLoadValue = 100;
    editor.initialControlPoints = [
      { time: 0, value: 5 },
      { time: 3, value: 8 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
      { time: 18, value: 30 },
      { time: 22, value: 12 },
      { time: 24, value: 5 },
    ];
    editor.ngOnChanges();
    expect(editor.points).toHaveLength(4);
    expect(editor.points[editor.points.length - 1]).toEqual({ time: 9, value: 15 });
  });

  it('lands the clip boundary exactly on the curve when cutting mid-segment', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 5 },
      { time: 3, value: 8 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
      { time: 18, value: 30 },
      { time: 22, value: 12 },
      { time: 24, value: 5 },
    ];
    const clipped = (LoadProfileEditor as any).clipControlPoints(points, 10);
    expect(clipped).toHaveLength(5);
    expect(clipped[clipped.length - 1].time).toBe(10);
    expect(clipped[clipped.length - 1].value).toBeCloseTo(12.04, 1);
  });

  it('does not duplicate a control point already at the sim boundary', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 5 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
    ];
    const clipped = (LoadProfileEditor as any).clipControlPoints(points, 9);
    expect(clipped).toEqual([
      { time: 0, value: 5 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
    ]);
  });

  it('falls back to a flat curve when the preset starts after the sim ends', () => {
    const points: ControlPoint[] = [
      { time: 12, value: 30 },
      { time: 24, value: 10 },
    ];
    const clipped = (LoadProfileEditor as any).clipControlPoints(points, 9);
    expect(clipped).toHaveLength(2);
    expect(clipped[0]).toEqual({ time: 0, value: 30 });
    expect(clipped[1]).toEqual({ time: 9, value: 30 });
  });

  it('drags the first point on the y axis only', () => {
    const editor = new LoadProfileEditor();
    editor.points = [
      { time: 0, value: 5 },
      { time: 4.5, value: 50 },
      { time: 9, value: 20 },
    ];
    editor.totalSteps = 10;
    editor.deltaTime = 1;
    editor.maxLoadValue = 100;
    editor.svgCanvas = {
      nativeElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
    } as any;

    editor.onPointMouseDown({ preventDefault: () => {} } as any, 0);
    expect(editor.isDragging).toBe(true);
    expect(editor.dragIndex).toBe(0);

    editor.onMouseMove({ clientX: 50, clientY: 25, movementY: 0 } as any);
    expect(editor.points[0].time).toBe(0);
    expect(editor.points[0].value).toBeCloseTo(75, 0);
  });

  it('drags the last point on the y axis only', () => {
    const editor = new LoadProfileEditor();
    editor.points = [
      { time: 0, value: 5 },
      { time: 4.5, value: 50 },
      { time: 9, value: 20 },
    ];
    editor.totalSteps = 10;
    editor.deltaTime = 1;
    editor.maxLoadValue = 100;
    editor.svgCanvas = {
      nativeElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
    } as any;

    editor.onPointMouseDown({ preventDefault: () => {} } as any, 2);
    editor.onMouseMove({ clientX: 50, clientY: 75, movementY: 0 } as any);
    expect(editor.points[2].time).toBe(9);
    expect(editor.points[2].value).toBeCloseTo(25, 0);
  });

  it('re-emits the full preset on a pristine apply, even when the sim is shorter than the preset', () => {
    const editor = new LoadProfileEditor();
    editor.totalSteps = 10;
    editor.deltaTime = 1;
    editor.maxLoadValue = 100;
    editor.initialControlPoints = [
      { time: 0, value: 5 },
      { time: 3, value: 8 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
      { time: 18, value: 30 },
      { time: 22, value: 12 },
      { time: 24, value: 5 },
    ];
    editor.ngOnChanges();

    let emitted: { profile: number[]; controlPoints: ControlPoint[] } | null = null;
    editor.save.subscribe(result => (emitted = result));
    editor.applyAndClose();

    expect(emitted).not.toBeNull();
    expect(emitted!.controlPoints).toHaveLength(8);
    expect(emitted!.controlPoints[emitted!.controlPoints.length - 1]).toEqual({ time: 24, value: 5 });
    expect(emitted!.profile).toHaveLength(10);
  });

  it('keeps the untouched preset tail when the user edits the curve', () => {
    const editor = new LoadProfileEditor();
    editor.totalSteps = 10;
    editor.deltaTime = 1;
    editor.maxLoadValue = 100;
    editor.initialControlPoints = [
      { time: 0, value: 5 },
      { time: 3, value: 8 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
      { time: 18, value: 30 },
      { time: 22, value: 12 },
      { time: 24, value: 5 },
    ];
    editor.svgCanvas = {
      nativeElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
    } as any;
    editor.ngOnChanges();

    editor.onPointMouseDown({ preventDefault: () => {} } as any, 1);
    editor.onMouseMove({ clientX: 100 / 3, clientY: 50, movementY: 0 } as any);

    let emitted: { profile: number[]; controlPoints: ControlPoint[] } | null = null;
    editor.save.subscribe(result => (emitted = result));
    editor.applyAndClose();

    expect(emitted).not.toBeNull();
    expect(emitted!.controlPoints).toHaveLength(8);
    expect(emitted!.controlPoints[1].time).toBeCloseTo(3, 5);
    expect(emitted!.controlPoints[1].value).toBe(50);
    expect(emitted!.controlPoints[4]).toEqual({ time: 12, value: 10 });
    expect(emitted!.controlPoints[emitted!.controlPoints.length - 1]).toEqual({ time: 24, value: 5 });
    expect(emitted!.profile).toHaveLength(10);
  });

  it('merges a boundary point edit on top of the untouched tail', () => {
    const editor = new LoadProfileEditor();
    editor.totalSteps = 10;
    editor.deltaTime = 1;
    editor.maxLoadValue = 100;
    editor.initialControlPoints = [
      { time: 0, value: 5 },
      { time: 3, value: 8 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
      { time: 18, value: 30 },
      { time: 22, value: 12 },
      { time: 24, value: 5 },
    ];
    editor.svgCanvas = {
      nativeElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
    } as any;
    editor.ngOnChanges();

    editor.onPointMouseDown({ preventDefault: () => {} } as any, 3);
    editor.onMouseMove({ clientX: 50, clientY: 50, movementY: 0 } as any);

    let emitted: { profile: number[]; controlPoints: ControlPoint[] } | null = null;
    editor.save.subscribe(result => (emitted = result));
    editor.applyAndClose();

    expect(emitted).not.toBeNull();
    expect(emitted!.controlPoints).toHaveLength(8);
    expect(emitted!.controlPoints[3]).toEqual({ time: 9, value: 50 });
    expect(emitted!.controlPoints[4]).toEqual({ time: 12, value: 10 });
    expect(emitted!.controlPoints[emitted!.controlPoints.length - 1]).toEqual({ time: 24, value: 5 });
  });
});
