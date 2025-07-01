import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from "jwt-decode";
import { environment } from '../../../environments/environment.prod';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private httpClient: HttpClient, private router: Router) {
    this.loadUserFromToken();
  }

  private id = inject(PLATFORM_ID);

  // HTTP Headers with Authorization
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  register(data: any): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Register', data);
  }

  login(data: any): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'Login', data).pipe(
      tap((response: any) => {
        if (response.status === 'success' && response.token) {
          this.saveToken(response.token);
          this.saveUser(response.user);
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  verifyOTP(data: { email: string, otp: string }): Observable<any> {
    return this.httpClient.post(environment.baseUrl + 'VerifyOTP', data);
  }

  verifyToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return new Observable(observer => {
        observer.error('No token found');
      });
    }
    return this.httpClient.post(environment.baseUrl + 'VerifyToken', { token });
  }

  // Enhanced token management
  decodeToken() {
    try {
      if (isPlatformBrowser(this.id)) {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          console.log('Decoded token:', decoded);
          return decoded;
        }
      }
    } catch (error) {
      console.error('Token decode error:', error);
      this.logOut();
    }
    return null;
  }

  saveToken(token: string): void {
    if (isPlatformBrowser(this.id)) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.id)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  saveUser(user: any): void {
    if (isPlatformBrowser(this.id)) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUser(): any {
    if (isPlatformBrowser(this.id)) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.id)) {
      const token = localStorage.getItem('token');
      if (!token) return false;

      try {
        const decoded = jwtDecode(token) as any;
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
      } catch {
        this.logOut();
        return false;
      }
    }
    return false;
  }

  loadUserFromToken(): void {
    if (this.isAuthenticated()) {
      const user = this.getUser();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
  }

  logOut(): void {
    if (isPlatformBrowser(this.id)) {
      localStorage.clear();
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }
  }

  // Method to get current user synchronously
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  // Method to update current user (for OTP verification)
  updateCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
  }

  // Method to check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const decoded = jwtDecode(token) as any;
      const currentTime = Date.now() / 1000;
      return decoded.exp <= currentTime;
    } catch {
      return true;
    }
  }

  // Method to refresh token (if needed in future)
  refreshToken(): Observable<any> {
    return this.verifyToken().pipe(
      tap((response: any) => {
        if (response.status === 'success') {
          // Token is still valid, no need to refresh
          return response;
        }
      }),
      catchError((error) => {
        this.logOut();
        throw error;
      })
    );
  }
}
