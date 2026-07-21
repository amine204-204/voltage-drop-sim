import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyPanel } from './property-panel.component';

describe('PropertyPanel', () => {
  let component: PropertyPanel;
  let fixture: ComponentFixture<PropertyPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
