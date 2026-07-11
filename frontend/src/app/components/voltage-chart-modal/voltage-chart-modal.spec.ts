import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoltageChartModal } from './voltage-chart-modal';

describe('VoltageChartModal', () => {
  let component: VoltageChartModal;
  let fixture: ComponentFixture<VoltageChartModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoltageChartModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoltageChartModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
