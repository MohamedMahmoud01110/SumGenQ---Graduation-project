import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { FooterComponent } from "./components/footer/footer.component";
import { NgxSpinnerComponent, NgxSpinnerService } from 'ngx-spinner';
import { LoadingService } from './services/loading.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent,NgxSpinnerComponent,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Text-Summarization';
  isLoading = false;

  constructor(private spinner: NgxSpinnerService,private loadingService: LoadingService) {
    this.loadingService.loading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }
  // ngOnInit() {
  //   this.spinner.show();
  //   setTimeout(() => {
  //     this.spinner.hide();
  //   }, 5000);
  // }
}
