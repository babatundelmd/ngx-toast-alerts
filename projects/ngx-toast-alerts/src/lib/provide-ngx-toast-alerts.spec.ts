import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  NGX_TOAST_ALERTS_CONFIG,
  NGX_TOAST_ALERTS_DEFAULTS,
} from './ngx-toast-alerts-config';
import { NgxToastAlertsService } from './ngx-toast-alerts.service';
import { provideNgxToastAlerts } from './provide-ngx-toast-alerts';

describe('provideNgxToastAlerts', () => {
  it('registers the config under the injection token', () => {
    TestBed.configureTestingModule({
      providers: [provideNgxToastAlerts({ position: 'bottom-left' })],
    });

    expect(TestBed.inject(NGX_TOAST_ALERTS_CONFIG)).toEqual({
      position: 'bottom-left',
    });
  });

  it('applies the config as the service defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        provideNgxToastAlerts({
          position: 'bottom-center',
          radius: 'soft',
          timeout: 999,
          showCloseButton: false,
        }),
      ],
    });

    const service = TestBed.inject(NgxToastAlertsService);
    service.info('configured');

    const { config } = service.toasts()[0];
    expect(config.position).toBe('bottom-center');
    expect(config.radius).toBe('soft');
    expect(config.timeout).toBe(999);
    expect(config.showCloseButton).toBe(false);
  });

  it('leaves unspecified options at the library defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideNgxToastAlerts({ position: 'center' })],
    });

    const service = TestBed.inject(NgxToastAlertsService);
    service.info('partial');

    const { config } = service.toasts()[0];
    expect(config.timeout).toBe(NGX_TOAST_ALERTS_DEFAULTS.timeout);
    expect(config.pauseOnHover).toBe(NGX_TOAST_ALERTS_DEFAULTS.pauseOnHover);
    expect(config.maxToasts).toBe(NGX_TOAST_ALERTS_DEFAULTS.maxToasts);
  });

  it('can be called with no arguments', () => {
    TestBed.configureTestingModule({
      providers: [provideNgxToastAlerts()],
    });

    const service = TestBed.inject(NgxToastAlertsService);
    service.info('bare');

    expect(service.toasts()[0].config.position).toBe(
      NGX_TOAST_ALERTS_DEFAULTS.position,
    );
  });

  it('is optional — the service works with no provider at all', () => {
    TestBed.configureTestingModule({});

    const service = TestBed.inject(NgxToastAlertsService);
    service.success('zero config');

    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].config).toEqual(
      expect.objectContaining({ position: 'top-right', radius: 'round' }),
    );
  });
});
