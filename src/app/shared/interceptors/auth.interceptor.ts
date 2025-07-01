import { AuthService } from './../../auth/services/auth.service';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private AuthService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get token from auth service
    const token = this.AuthService.getToken();

    // Don't add Authorization header for OTP verification, registration, or login requests
    const isAuthRequest = request.url.includes('VerifyOTP') ||
                         request.url.includes('Register') ||
                         request.url.includes('Login');

    // Clone the request and add authorization header if token exists and it's not an auth request
    if (token && !isAuthRequest) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Handle the request and catch any errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // If we get a 401 Unauthorized error and it's not an auth request, the token might be invalid
        if (error.status === 401 && !isAuthRequest) {
          console.log('Token is invalid or expired, logging out user');
          this.AuthService.logOut();
        }
        return throwError(() => error);
      })
    );
  }
}
