import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GapTextCardComponent } from './gap-text-card.component';

describe('GapTextCardComponent', () => {
  let component: GapTextCardComponent;
  let fixture: ComponentFixture<GapTextCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GapTextCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GapTextCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
