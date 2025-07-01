import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookSummaryViewerComponent } from './book-summary-viewer.component';

describe('BookSummaryViewerComponent', () => {
  let component: BookSummaryViewerComponent;
  let fixture: ComponentFixture<BookSummaryViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookSummaryViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookSummaryViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
