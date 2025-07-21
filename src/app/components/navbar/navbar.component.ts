import { AfterViewInit, Component, inject, Input, ViewChild, ElementRef } from '@angular/core';
import { ThemeService } from './../../services/theme.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';

declare global {
  interface Window {
    bootstrap: any;
  }
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [RouterLink,RouterLinkActive,CommonModule],
})
export class NavbarComponent  {
  isDarkMode: boolean = false;
  theme : string ='';
  private readonly auth = inject(AuthService);

  @Input() layout!: string;
  @ViewChild('navbarCollapse', { static: false }) navbarCollapse!: ElementRef;


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

  onNavLinkClick() {
    if (window.innerWidth < 992 && this.navbarCollapse) {
      // Bootstrap 5 Collapse API
      // @ts-ignore
      const bsCollapse = window.bootstrap?.Collapse?.getOrCreateInstance
        ? window.bootstrap.Collapse.getOrCreateInstance(this.navbarCollapse.nativeElement)
        : null;
      if (bsCollapse && bsCollapse.hide) {
        bsCollapse.hide();
      } else if (this.navbarCollapse.nativeElement.classList.contains('show')) {
        this.navbarCollapse.nativeElement.classList.remove('show');
      }
    }
  }

  toggleNavbar() {
    if (this.navbarCollapse) {
      const bsCollapse = window.bootstrap?.Collapse?.getOrCreateInstance
        ? window.bootstrap.Collapse.getOrCreateInstance(this.navbarCollapse.nativeElement)
        : null;
      if (bsCollapse) {
        if (this.navbarCollapse.nativeElement.classList.contains('show')) {
          bsCollapse.hide();
        } else {
          bsCollapse.show();
        }
      }
    }
  }


}
