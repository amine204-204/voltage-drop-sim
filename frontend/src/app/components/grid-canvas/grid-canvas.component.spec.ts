import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridCanvas } from './grid-canvas.component';

describe('GridCanvas', () => {
  let component: GridCanvas;
  let fixture: ComponentFixture<GridCanvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridCanvas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridCanvas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
