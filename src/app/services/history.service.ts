import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export interface TextSummary {
  id: number;
  Text: string;
  Summary: string;
  Topic?: string; // Optional since it might not exist in DB
  created_at: string;
}

export interface BookSummary {
  id: number;
  Book: string;
  Summary: string;
  Topic: string;
  created_at: string;
}

export interface HistoryResponse {
  message: string;
  status: string;
  data: TextSummary[] | BookSummary[];
}

export interface AddSummaryResponse {
  message: string;
  status: string;
}

export interface DeleteResponse {
  message: string;
  status: string;
}

export interface Chat {
  id: number;
  UserId: number;
  BookId: number;
  Question: string;
  Answer: string;
  // Add other fields if your backend returns more
}

export interface ChatResponse {
  message: string;
  status: string;
  data: Chat[];
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private baseUrl = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Server returned ${error.status}: ${error.statusText}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  getTextSummaries(): Observable<any> {
    return this.http.get(`${this.baseUrl}TextSummarizes`, { headers: this.getAuthHeaders() });
  }

  getBookSummaries(): Observable<any> {
    return this.http.get(`${this.baseUrl}BookSummarizes`, { headers: this.getAuthHeaders() });
  }

  addTextSummary(data: { Text: string; Summary: string; Topic: string }): Observable<AddSummaryResponse> {
    // Send Text, Summary, and Topic to match your backend
    const payload = {
      Text: data.Text,
      Summary: data.Summary,
      Topic: data.Topic
    };

    return this.http.post<AddSummaryResponse>(
      `${this.baseUrl}AddTextSummary`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  addBookSummary(data: { Book: string; Summary: string; Topic: string }): Observable<AddSummaryResponse> {
    const payload = {
      Book: data.Book,
      Summary: data.Summary,
      Topic: data.Topic
    };

    return this.http.post<AddSummaryResponse>(
      `${this.baseUrl}AddBookSummary`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Delete individual text summary
  deleteTextSummary(id: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteTextSummary`,
      { id },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Delete individual book summary
  deleteBookSummary(id: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteBookSummary`,
      { id },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Delete all text summaries
  deleteAllTextSummaries(): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteAllTextSummaries`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Delete all book summaries
  deleteAllBookSummaries(): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteAllBookSummaries`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }


    // Add a chat message to a book
  addChat(data: { BookId: number; Question: string; Answer: string }): Observable<AddSummaryResponse> {
    return this.http.post<AddSummaryResponse>(
      `${this.baseUrl}AddChat`,
      data,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Get all chat messages for a book
  getAllChat(bookId: number): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.baseUrl}GetAllChat`,
      { id: bookId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Delete all chat messages for a book
  deleteAllChat(bookId: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteAllChat`,
      { id: bookId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }
}
