import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryResultComponent } from './summary-result.component';

describe('SummaryResultComponent', () => {
  let component: SummaryResultComponent;
  let fixture: ComponentFixture<SummaryResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
