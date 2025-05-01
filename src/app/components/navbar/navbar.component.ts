import { Component } from '@angular/core';
import { ThemeService } from './../../services/theme.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [RouterLink,RouterLinkActive,CommonModule],
})
export class NavbarComponent {
  isDarkMode: boolean = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Get the saved theme and apply it when the component initializes
    this.isDarkMode = false; // Default to light mode
    // this.isDarkMode = this.themeService.getTheme() === 'dark';

  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    const newTheme = this.isDarkMode ? 'dark' : 'light';
    this.themeService.setTheme(newTheme); // Update the theme
  }
}
