import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadProfileEditor } from './load-profile-editor';

describe('LoadProfileEditor', () => {
  let component: LoadProfileEditor;
  let fixture: ComponentFixture<LoadProfileEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadProfileEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadProfileEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
