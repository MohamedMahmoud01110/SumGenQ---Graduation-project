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

// Quiz-related interfaces
export interface QuizQuestion {
  question: string;
  userAnswer: string;
  userAnswerText?: string;
  rightAnswer: string;
  rightAnswerText?: string;
  feedback:string
}

export interface Quiz {
  id: number;
  score: number;
  level?: string;
  questions: QuizQuestion[];
}

export interface QuizResponse {
  status: string;
  quizzes: Quiz[];
}

export interface AddQuizRequest {
  Score: number;
  Level?: string;
  Questions: QuizQuestion[];
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

  // Text Summary Methods
  getTextSummaries(): Observable<any> {
    return this.http.get(`${this.baseUrl}TextSummarizes`, { headers: this.getAuthHeaders() });
  }

  addTextSummary(data: { Text: string; Summary: string; Topic: string }): Observable<AddSummaryResponse> {
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

  deleteTextSummary(id: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteTextSummary`,
      { id },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteAllTextSummaries(): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteAllTextSummaries`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Book Summary Methods
  getBookSummaries(): Observable<any> {
    return this.http.get(`${this.baseUrl}BookSummarizes`, { headers: this.getAuthHeaders() });
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

  deleteBookSummary(id: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteBookSummary`,
      { id },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteAllBookSummaries(): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(
      `${this.baseUrl}DeleteAllBookSummaries`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Chat Methods
  addChat(data: { BookId: number; Question: string; Answer: string }): Observable<AddSummaryResponse> {
    return this.http.post<AddSummaryResponse>(
      `${this.baseUrl}AddChat`,
      data,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getAllChat(bookId: number): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.baseUrl}GetAllChat`,
      { id: bookId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Quiz Methods
  addQuiz(data: AddQuizRequest): Observable<AddSummaryResponse> {
    return this.http.post<AddSummaryResponse>(
      `${this.baseUrl}AddQuiz`,
      data,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getUserQuizzes(): Observable<QuizResponse> {
    return this.http.get<QuizResponse>(
      `${this.baseUrl}GetUserQuizzes`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteQuiz(quizId: number): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(
      `${this.baseUrl}DeleteQuiz/${quizId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Helper Methods
  createQuizData(score: number, questions: QuizQuestion[], level?: string): AddQuizRequest {
    return {
      Score: score,
      Level: level || 'medium',
      Questions: questions
    };
  }

  // Utility method to format chat data
  createChatData(bookId: number, question: string, answer: string): { BookId: number; Question: string; Answer: string } {
    return {
      BookId: bookId,
      Question: question,
      Answer: answer
    };
  }

  // Utility method to format text summary data
  createTextSummaryData(text: string, summary: string, topic: string): { Text: string; Summary: string; Topic: string } {
    return {
      Text: text,
      Summary: summary,
      Topic: topic
    };
  }

  // Utility method to format book summary data
  createBookSummaryData(book: string, summary: string, topic: string): { Book: string; Summary: string; Topic: string } {
    return {
      Book: book,
      Summary: summary,
      Topic: topic
    };
  }
}
