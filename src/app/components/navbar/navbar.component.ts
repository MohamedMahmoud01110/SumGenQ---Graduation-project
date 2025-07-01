import { Component, inject, Input } from '@angular/core';
import { ThemeService } from './../../services/theme.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [RouterLink,RouterLinkActive,CommonModule],
})
export class NavbarComponent {
  isDarkMode: boolean = false;
  theme : string ='';
  private readonly auth = inject(AuthService);

  @Input() layout!: string;


  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Get the saved theme and apply it when the component initializes
    this.theme = this.themeService.getTheme();
    this.themeService.theme$.subscribe((theme) => {
      this.theme = theme;
    });
    this.auth.decodeToken();
  }
  logOut(){
    this.auth.logOut();
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.themeService.setTheme(this.theme);
  }
}
