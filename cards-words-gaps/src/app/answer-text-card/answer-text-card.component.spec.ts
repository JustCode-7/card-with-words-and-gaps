import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerTextCardComponent } from './answer-text-card.component';

describe('AnswerTextCardComponent', () => {
  let component: AnswerTextCardComponent;
  let fixture: ComponentFixture<AnswerTextCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnswerTextCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnswerTextCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
