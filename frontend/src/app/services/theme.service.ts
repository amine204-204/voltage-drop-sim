import { Injectable, signal, effect, computed } from '@angular/core';

const STORAGE_KEY = 'voltage-drop-sim-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly LIGHT = 'light';
  private static readonly DARK = 'dark';

  private readonly _mode = signal<'light' | 'dark'>(ThemeService.loadTheme());

  public readonly mode = this._mode.asReadonly();
  public readonly isLight = computed(() => this._mode() === 'light');

  constructor() {
    this.applyTheme(this._mode());
  }

  public toggle() {
    const next = this._mode() === ThemeService.LIGHT ? ThemeService.DARK : ThemeService.LIGHT;
    this._mode.set(next);
    this.persist(next);
    this.applyTheme(next);
  }

  public setLight() { this.setMode(ThemeService.LIGHT); }
  public setDark() { this.setMode(ThemeService.DARK); }

  private setMode(mode: 'light' | 'dark') {
    if (this._mode() !== mode) {
      this._mode.set(mode);
      this.persist(mode);
      this.applyTheme(mode);
    }
  }

  private applyTheme(mode: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', mode);
  }

  private static loadTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === ThemeService.LIGHT || stored === ThemeService.DARK) return stored;
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return ThemeService.LIGHT;
    return ThemeService.DARK;
  }

  private persist(mode: 'light' | 'dark') {
    localStorage.setItem(STORAGE_KEY, mode);
  }
}
