import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the hero heading', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Toasts that feel');
  });

  it('should default to the top-right position', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.position()).toBe('top-right');
  });

  it('should offer every position as a picker slot', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const slots = [...compiled.querySelectorAll('.viewport__slot')].map((slot) =>
      slot.getAttribute('aria-label'),
    );
    expect(slots).toEqual(fixture.componentInstance.positions as string[]);
  });

  it('should document the API in three tables', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('table')).toHaveLength(3);
    expect(compiled.querySelectorAll('tbody tr').length).toBeGreaterThan(20);
  });
});
