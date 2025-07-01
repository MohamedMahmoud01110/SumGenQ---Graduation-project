import { PasswordValidators } from './../../components/helper/validators';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ValidationMessagesComponent } from '../../components/validation-messages/validation-messages/validation-messages.component';
import { EmailValidators, NameValidators } from '../../components/helper/validators';
import { passwordMatchValidation } from '../../components/helper/password-match';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, ValidationMessagesComponent,CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent implements OnDestroy {
  resMsg:string='';
  isLoading :boolean=true;
  registerForm !: FormGroup;
  otpForm!: FormGroup;
  showPassword: boolean = false;
  showPassword2: boolean = false;
  showOTPForm = false;

  // OTP retry and countdown functionality
  otpRetryCount = 0;
  maxOtpRetries = 3;
  resendCountdown = 0;
  canResendOTP = true;
  private countdownSubscription?: Subscription;

  // Flag to prevent redirects during OTP verification
  private isVerifyingOTP = false;

  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)
  private readonly fb = inject(FormBuilder)

  formInit() {
  this.registerForm = this.fb.group({
    name: [null, NameValidators],
    email: [null, EmailValidators],
    password: [null, PasswordValidators],
    rePassword: [null, PasswordValidators]
  }, { validators: [passwordMatchValidation] });

  // Add OTP form initialization
  this.otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });
}

  submitForm() {
  this.isLoading = false;
  if (this.registerForm.valid || !this.isLoading) {
    console.log(this.registerForm.value);
    this.authService.register(this.registerForm.value).subscribe({
      next: (res: any) => {
        console.log(res);
        this.isLoading = true;

        if (res.status === 'pending') {
          // OTP sent successfully, show OTP input form
          this.showOTPForm = true;
          this.resMsg = res.message; // "OTP sent to your email"
          this.startResendCountdown();
        } else if (res.status === 'success') {
          // Direct success (if no OTP required)
          this.resMsg = res.message;
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1000);
        } else {
          this.resMsg = res.message;
        }
      },
      error: (error) => {
        console.error(error);
        this.resMsg = error.error?.message || 'Registration failed. Please try again.';
        this.isLoading = true;
      }
    });
  }
}

verifyOTP() {
  if (this.otpForm.valid) {
    this.isLoading = false;
    this.isVerifyingOTP = true; // Set flag to prevent redirects

    const otpData = {
      email: this.registerForm.value.email,
      otp: this.otpForm.value.otp
    };

    console.log('Verifying OTP:', otpData);

    this.authService.verifyOTP(otpData).subscribe({
      next: (res: any) => {
        console.log('OTP verification response:', res);
        this.isLoading = true;
        this.isVerifyingOTP = false; // Clear flag

        if (res.status === 'success') {
          // Manually save token and user data when OTP verification is successful
          if (res.token) {
            this.authService.saveToken(res.token);
            if (res.user) {
              this.authService.saveUser(res.user);
              this.authService.updateCurrentUser(res.user);
            }
          }

          this.resMsg = res.message; // "User registered successfully"
          // Redirect to home page after successful verification
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1000);
        } else {
          // OTP verification failed but not an HTTP error
          console.log('OTP verification failed with status:', res.status);
          this.handleOtpFailure(res.message || 'Invalid OTP. Please try again.');
        }
      },
      error: (error) => {
        console.error('OTP verification error:', error);
        this.isLoading = true;
        this.isVerifyingOTP = false; // Clear flag

        // Don't redirect to login on OTP verification errors
        // Just show the error message and let user retry
        const errorMessage = error.error?.message ||
                           error.message ||
                           'OTP verification failed. Please try again.';

        console.log('Handling OTP failure with message:', errorMessage);
        this.handleOtpFailure(errorMessage);
      }
    });
  }
}

private handleOtpFailure(errorMessage: string) {
  console.log('Handling OTP failure. Current retry count:', this.otpRetryCount);

  this.otpRetryCount++;
  this.resMsg = errorMessage;

  // Clear the OTP input for retry
  this.otpForm.patchValue({ otp: '' });

  if (this.otpRetryCount >= this.maxOtpRetries) {
    this.resMsg = `Maximum OTP attempts reached. Please click "Resend OTP" to get a new code.`;
    // Disable the verify button temporarily
    this.otpForm.get('otp')?.disable();
  }

  // Ensure we stay on the OTP form
  this.showOTPForm = true;
  console.log('OTP failure handled. Staying on OTP form. Retry count:', this.otpRetryCount);
}

resendOTP() {
  if (!this.canResendOTP) {
    return;
  }

  this.isLoading = false;
  this.authService.register(this.registerForm.value).subscribe({
    next: (res: any) => {
      console.log(res);
      this.isLoading = true;

      if (res.status === 'pending') {
        this.resMsg = 'OTP resent to your email';
        this.otpRetryCount = 0; // Reset retry count
        this.otpForm.get('otp')?.enable(); // Re-enable OTP input
        this.startResendCountdown();
      } else {
        this.resMsg = res.message;
      }
    },
    error: (error) => {
      console.error(error);
      this.resMsg = error.error?.message || 'Failed to resend OTP. Please try again.';
      this.isLoading = true;
    }
  });
}

private startResendCountdown() {
  this.canResendOTP = false;
  this.resendCountdown = 60; // 60 seconds countdown

  this.countdownSubscription = interval(1000).subscribe(() => {
    this.resendCountdown--;
    if (this.resendCountdown <= 0) {
      this.canResendOTP = true;
      this.countdownSubscription?.unsubscribe();
    }
  });
}

backToRegister() {
  this.showOTPForm = false;
  this.resMsg = '';
  this.otpForm.reset();
  this.otpRetryCount = 0;
  this.canResendOTP = true;
  this.resendCountdown = 0;
  this.countdownSubscription?.unsubscribe();
}

togglePassword() {
    this.showPassword = !this.showPassword;
  }
  togglePassword2() {
      this.showPassword2 = !this.showPassword2;
    }

ngOnInit(): void {
  this.formInit()
}

ngOnDestroy(): void {
  this.countdownSubscription?.unsubscribe();
}

}
