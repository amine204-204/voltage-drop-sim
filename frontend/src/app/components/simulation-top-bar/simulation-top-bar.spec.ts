import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulationTopBar } from './simulation-top-bar';

describe('SimulationTopBar', () => {
  let component: SimulationTopBar;
  let fixture: ComponentFixture<SimulationTopBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationTopBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimulationTopBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
