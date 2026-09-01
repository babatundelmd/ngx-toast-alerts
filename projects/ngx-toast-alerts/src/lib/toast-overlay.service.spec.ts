import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastOverlayService } from './toast-overlay.service';

const hosts = () => document.querySelectorAll('ngx-toast-alerts');

describe('ToastOverlayService', () => {
  afterEach(() => {
    // TestBed teardown destroys the injector, but be defensive: a leaked host
    // would make every later assertion in this file lie.
    hosts().forEach((host) => host.remove());
  });

  describe('in the browser', () => {
    let service: ToastOverlayService;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      service = TestBed.inject(ToastOverlayService);
    });

    it('mounts nothing until asked', () => {
      expect(hosts()).toHaveLength(0);
    });

    it('appends a single host to the body', () => {
      service.createToastOverlay();

      expect(hosts()).toHaveLength(1);
      expect(hosts()[0].parentElement).toBe(document.body);
    });

    it('is idempotent', () => {
      service.createToastOverlay();
      service.createToastOverlay();
      service.createToastOverlay();

      expect(hosts()).toHaveLength(1);
    });

    it('removes the host on destroy', () => {
      service.createToastOverlay();
      service.destroyToastOverlay();

      expect(hosts()).toHaveLength(0);
    });

    it('tolerates a destroy without a create', () => {
      expect(() => service.destroyToastOverlay()).not.toThrow();
    });

    it('can be re-created after being destroyed', () => {
      service.createToastOverlay();
      service.destroyToastOverlay();
      service.createToastOverlay();

      expect(hosts()).toHaveLength(1);
    });
  });

  describe('on the server', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
    });

    it('never touches the DOM', () => {
      const service = TestBed.inject(ToastOverlayService);
      service.createToastOverlay();

      expect(hosts()).toHaveLength(0);
    });
  });
});
