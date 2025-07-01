import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ValidationMessagesComponent } from "../../components/validation-messages/validation-messages/validation-messages.component";
import { AuthService } from '../services/auth.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log-in',
  imports: [RouterLink, ValidationMessagesComponent,CommonModule,ReactiveFormsModule],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.css'
})
export class LogInComponent {
  resMsg:string='';
  isLoading :boolean=true;
  showPassword: boolean = false;
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)

  loginForm = new FormGroup({
    email : new FormControl(null,[
      Validators.required,
      Validators.email
      ]),
      password : new FormControl(null,[
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        ])
  })

  // submitForm(){
  //   this.isLoading =false;
  //   if(this.loginForm.valid || !this.isLoading){
  //     console.log(this.loginForm.value);
  //     this.authService.login(this.loginForm.value).subscribe({
  //       next: (res:any) => {
  //         console.log(res);
  //         this.isLoading = true;
  //         if(res.message=='success'){
  //           this.authService.saveToken(res.token);
  //           this.router.navigate(['/home'])
  //         }
  //       },
  //       error: (error) => {
  //         console.error(error);
  //         this.resMsg = error.error.message;
  //         this.isLoading = true;
  //       }
  //     })
  //   }
  // }
  submitForm() {
  this.isLoading = false;
  if (this.loginForm.valid || !this.isLoading) {
    console.log(this.loginForm.value);
    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        console.log(res);
        this.isLoading = true;

        if (res.status === 'success') {
          // Token and user data are automatically saved by the service
          this.resMsg = res.message;
          // Navigate to home page after successful login
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1000);
        } else {
          this.resMsg = res.message;
        }
      },
      error: (error) => {
        console.error(error);
        this.resMsg = error.error?.message || 'Login failed. Please try again.';
        this.isLoading = true;
      }
    });
  }
}


  togglePassword() {
      this.showPassword = !this.showPassword;
    }
}
