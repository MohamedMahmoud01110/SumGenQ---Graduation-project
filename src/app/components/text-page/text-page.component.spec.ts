import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextPageComponent } from './text-page.component';

describe('TextPageComponent', () => {
  let component: TextPageComponent;
  let fixture: ComponentFixture<TextPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
