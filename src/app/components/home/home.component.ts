import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { ProjectDetailsComponent } from "../project-details/project-details.component";
import { OurFeaturesComponent } from "../our-features/our-features.component";
import { ScrollTopComponent } from "../scroll-top/scroll-top.component";
import Typed from 'typed.js';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [ProjectDetailsComponent, OurFeaturesComponent, ScrollTopComponent]
})
export class HomeComponent implements OnInit {
  theme: string = '';
   private typed!: Typed;
   ngAfterViewInit(): void {
    const options = {
      strings: ['Text', 'Article','Paper', 'Book', 'Docs','Paras', 'Essay'],
      typeSpeed: 80,
      backSpeed: 80,
      loop: true
    };

    this.typed = new Typed('#element', options);
  }


  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.theme = this.themeService.getTheme();
    this.themeService.theme$.subscribe((theme) => {
      this.theme = theme;
    });
  }

  ngOnDestroy(): void {
    // Prevent memory leaks
    // this.typed?.destroy();
  }
}

