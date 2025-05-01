import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<string>('light'); // default theme
  theme$ = this.themeSubject.asObservable();

  setTheme(theme: string) {
    this.themeSubject.next(theme);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }

  getTheme(): string {
    return localStorage.getItem('theme') || 'dark'; // default to dark theme if not set
  }

  initTheme() {
    const savedTheme = this.getTheme();
    this.setTheme(savedTheme);
  }
}
