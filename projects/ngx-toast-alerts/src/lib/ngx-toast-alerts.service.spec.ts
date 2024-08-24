import { TestBed } from '@angular/core/testing';

import { NgxToastAlertsService } from './ngx-toast-alerts.service';

describe('NgxToastAlertsService', () => {
  let service: NgxToastAlertsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxToastAlertsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
