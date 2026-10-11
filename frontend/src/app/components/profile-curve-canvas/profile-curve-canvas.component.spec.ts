import { describe, it, expect } from 'vitest';
import { ProfileCurveCanvas, ControlPoint } from './profile-curve-canvas.component';

function makeCanvas(points: ControlPoint[], totalDuration = 9, maxLoadValue = 100): ProfileCurveCanvas {
  const canvas = new ProfileCurveCanvas();
  canvas.maxLoadValue = maxLoadValue;
  canvas.totalDuration = totalDuration;
  canvas.initialPoints = points;
  canvas.svgCanvas = {
    nativeElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
  } as any;
  return canvas;
}

describe('ProfileCurveCanvas drag interaction', () => {
  it('clamps the first point to its right neighbor when dragged horizontally', () => {
    const canvas = makeCanvas([
      { time: 0, value: 5 },
      { time: 4.5, value: 50 },
      { time: 9, value: 20 },
    ]);

    canvas.onPointMouseDown({ preventDefault: () => {} } as any, 0);
    expect(canvas.isDragging).toBe(true);
    expect(canvas.dragIndex).toBe(0);

    canvas.onMouseMove({ clientX: 50, clientY: 25, movementY: 0 } as any);
    expect(canvas.points[0].time).toBeGreaterThan(0);
    expect(canvas.points[0].time).toBeLessThan(4.5);
    expect(canvas.points[0].value).toBeCloseTo(75, 0);
  });

  it('clamps the last point to its left neighbor when dragged horizontally', () => {
    const canvas = makeCanvas([
      { time: 0, value: 5 },
      { time: 4.5, value: 50 },
      { time: 9, value: 20 },
    ]);

    canvas.onPointMouseDown({ preventDefault: () => {} } as any, 2);
    canvas.onMouseMove({ clientX: 50, clientY: 75, movementY: 0 } as any);
    expect(canvas.points[2].time).toBeGreaterThan(4.5);
    expect(canvas.points[2].time).toBeLessThan(9);
    expect(canvas.points[2].value).toBeCloseTo(25, 0);
  });

  it('moves an interior point on both axes with clamping to neighbors', () => {
    const canvas = makeCanvas([
      { time: 0, value: 0 },
      { time: 4.5, value: 50 },
      { time: 9, value: 0 },
    ]);

    canvas.onPointMouseDown({ preventDefault: () => {} } as any, 1);
    canvas.onMouseMove({ clientX: 30, clientY: 30, movementY: 0 } as any);
    expect(canvas.points[1].time).toBeCloseTo(2.7, 1);
    expect(canvas.points[1].value).toBeCloseTo(70, 0);

    canvas.onMouseMove({ clientX: 5, clientY: 30, movementY: 0 } as any);
    expect(canvas.points[1].time).toBeGreaterThan(0);

    canvas.onMouseMove({ clientX: 95, clientY: 30, movementY: 0 } as any);
    expect(canvas.points[1].time).toBeLessThan(9);
  });

  it('expands the scale when dragging above the current max', () => {
    const canvas = makeCanvas([
      { time: 0, value: 0 },
      { time: 9, value: 0 },
    ]);

    const before = canvas.scaleMax;
    canvas.onPointMouseDown({ preventDefault: () => {} } as any, 1);
    canvas.onMouseMove({ clientX: 50, clientY: -20, movementY: -30 } as any);
    expect(canvas.scaleMax).toBeGreaterThan(before);
  });

  it('emits the edited points on mouse up', () => {
    const canvas = makeCanvas([
      { time: 0, value: 5 },
      { time: 4.5, value: 50 },
      { time: 9, value: 20 },
    ]);

    let emitted: ControlPoint[] | null = null;
    canvas.pointsChange.subscribe(result => (emitted = result));

    canvas.onPointMouseDown({ preventDefault: () => {} } as any, 1);
    canvas.onMouseMove({ clientX: 50, clientY: 50, movementY: 0 } as any);
    canvas.onMouseUp();

    expect(emitted).not.toBeNull();
    expect(emitted![1].value).toBeCloseTo(50, 0);
  });
});

describe('ProfileCurveCanvas add / remove points', () => {
  it('adds a point between two existing points', () => {
    const canvas = makeCanvas([
      { time: 0, value: 0 },
      { time: 9, value: 100 },
    ]);

    let emitted: ControlPoint[] | null = null;
    canvas.pointsChange.subscribe(result => (emitted = result));

    canvas.addPoint({ clientX: 50, clientY: 50, target: { tagName: 'svg' } } as any);

    expect(canvas.points).toHaveLength(3);
    expect(canvas.points[1].time).toBeCloseTo(4.5, 1);
    expect(emitted).not.toBeNull();
    expect(emitted!).toHaveLength(3);
  });

  it('ignores clicks when time already occupied by a point', () => {
    const canvas = makeCanvas([
      { time: 0, value: 0 },
      { time: 9, value: 100 },
    ]);

    canvas.addPoint({ clientX: 0, clientY: 50, target: { tagName: 'svg' } } as any);
    expect(canvas.points).toHaveLength(2);
  });

  it('does not remove endpoints', () => {
    const canvas = makeCanvas([
      { time: 0, value: 0 },
      { time: 4.5, value: 50 },
      { time: 9, value: 100 },
    ]);

    canvas.removePoint({ preventDefault: () => {}, stopPropagation: () => {} } as any, 0);
    expect(canvas.points).toHaveLength(3);
  });

  it('removes an interior point', () => {
    const canvas = makeCanvas([
      { time: 0, value: 0 },
      { time: 4.5, value: 50 },
      { time: 9, value: 100 },
    ]);

    let emitted: ControlPoint[] | null = null;
    canvas.pointsChange.subscribe(result => (emitted = result));

    canvas.removePoint({ preventDefault: () => {}, stopPropagation: () => {} } as any, 1);

    expect(canvas.points).toHaveLength(2);
    expect(emitted!).toHaveLength(2);
  });
});

describe('ProfileCurveCanvas flat hold rendering', () => {
  it('extends the path flat from the left edge to the first point', () => {
    const canvas = makeCanvas([
      { time: 2, value: 10 },
      { time: 4.5, value: 50 },
      { time: 7, value: 20 },
    ]);

    const firstY = 90;
    const firstX = (2 / 9) * 100;
    expect(canvas.svgPath).toMatch(new RegExp(`^M 0,${firstY} L ${firstX},${firstY}`));
  });

  it('extends the path flat from the last point to the right edge', () => {
    const canvas = makeCanvas([
      { time: 2, value: 10 },
      { time: 4.5, value: 50 },
      { time: 7, value: 20 },
    ]);

    const lastY = 80;
    expect(canvas.svgPath.endsWith(` L 100,${lastY}`)).toBe(true);
  });

  it('draws a zero-length tail when the endpoints sit on the chart edges', () => {
    const canvas = makeCanvas([
      { time: 0, value: 0 },
      { time: 9, value: 100 },
    ]);

    const firstY = 100;
    const lastY = 0;
    expect(canvas.svgPath).toMatch(new RegExp(`^M 0,${firstY} L 0,${firstY}`));
    expect(canvas.svgPath.endsWith(` L 100,${lastY}`)).toBe(true);
  });
});

describe('ProfileCurveCanvas time formatting', () => {
  it('formats sub-minute durations in seconds', () => {
    const canvas = makeCanvas([{ time: 0, value: 0 }, { time: 1, value: 1 }], 1);
    expect(canvas.formatTime(0)).toBe('0 s');
    expect(canvas.formatTime(0.5)).toBe('0.5 s');
  });

  it('formats minute-scale durations as m:ss', () => {
    const canvas = makeCanvas([{ time: 0, value: 0 }, { time: 60, value: 1 }], 60);
    expect(canvas.formatTime(0)).toBe('0:00');
    expect(canvas.formatTime(30)).toBe('0:30');
    expect(canvas.formatTime(60)).toBe('1:00');
    expect(canvas.formatTime(90)).toBe('1:30');
  });

  it('formats hour-scale durations as h:mm', () => {
    const canvas = makeCanvas([{ time: 0, value: 0 }, { time: 86400, value: 1 }], 86400);
    expect(canvas.formatTime(0)).toBe('0:00');
    expect(canvas.formatTime(3600)).toBe('1:00');
    expect(canvas.formatTime(7200)).toBe('2:00');
    expect(canvas.formatTime(86400)).toBe('24:00');
  });

  it('rolls over a rounded minute into the next hour', () => {
    const canvas = makeCanvas([{ time: 0, value: 0 }, { time: 86400, value: 1 }], 86400);
    expect(canvas.formatTime(3599)).toBe('1:00');
    expect(canvas.formatTime(86340)).toBe('23:59');
    expect(canvas.formatTime(86399)).toBe('24:00');
  });
});
