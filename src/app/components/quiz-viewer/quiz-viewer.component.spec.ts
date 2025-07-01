import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizViewerComponent } from './quiz-viewer.component';

describe('QuizViewerComponent', () => {
  let component: QuizViewerComponent;
  let fixture: ComponentFixture<QuizViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
