import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxToastAlertsComponent } from './ngx-toast-alerts.component';

describe('NgxToastAlertsComponent', () => {
  let component: NgxToastAlertsComponent;
  let fixture: ComponentFixture<NgxToastAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxToastAlertsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxToastAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
