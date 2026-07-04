import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  private theme$ = new BehaviorSubject<Theme>(this.getStoredTheme());
  public theme = this.theme$.asObservable();

  constructor() {
    this.applyTheme(this.theme$.value);
    this.mediaQuery.addEventListener('change', () => {
      if (this.theme$.value === 'system') {
        this.applyResolvedTheme();
      }
    });
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    return stored ?? 'system';
  }

  getCurrentTheme(): Theme {
    return this.theme$.value;
  }

  setTheme(theme: Theme): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.theme$.next(theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    if (theme === 'system') {
      this.applyResolvedTheme();
    } else {
      this.setDocumentClass(theme);
    }
  }

  private applyResolvedTheme(): void {
    const resolved: 'light' | 'dark' = this.mediaQuery.matches
      ? 'dark'
      : 'light';
    this.setDocumentClass(resolved);
  }

  private setDocumentClass(resolved: 'light' | 'dark'): void {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${resolved}`);
  }
}
