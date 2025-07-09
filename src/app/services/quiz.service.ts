import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HistoryService } from '../services/history.service';

// Interfaces matching the FastAPI schemas
export interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

export interface TrueFalse {
  question: string;
  answer: boolean;
}

export interface Essay {
  question: string;
  ideal_answer: string;
}

export interface QuizResponse {
  mcqs: MCQ[];
  true_false: TrueFalse[];
  essays: Essay[];
}

export interface UserAnswers {
  mcqs: string[];
  true_false: boolean[];
  essays: string[];
}

export interface GradeRequest {
  user_answers: UserAnswers;
  quiz: QuizResponse;
}

export interface GradeResponse {
  final_score: number;
  essay_feedback: string[];
}

export interface HealthResponse {
  status: string;
  service: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly baseUrl = 'http://localhost:8003'; // Match your FastAPI port
  private readonly apiUrl = `${this.baseUrl}/api`;
  private quizSaved = false;

  constructor(private http: HttpClient, private historyService: HistoryService) { }

  /**
   * Generate a quiz from uploaded file
   * @param file - The file to upload (PDF, TXT, DOCX)
   * @param difficulty - Quiz difficulty (easy, medium, hard)
   * @returns Observable of QuizResponse
   */
  generateQuiz(file: File, difficulty: string = 'medium'): Observable<QuizResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('difficulty', difficulty);

    return this.http.post<QuizResponse>(`${this.apiUrl}/quiz/generate`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Submit and grade quiz answers
   * @param gradeRequest - The quiz answers and original quiz
   * @returns Observable of GradeResponse
   */
  submitAnswers(gradeRequest: GradeRequest): Observable<GradeResponse> {
    return this.http.post<GradeResponse>(`${this.apiUrl}/grade/submit`, gradeRequest)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Health check for quiz generator service
   * @returns Observable of HealthResponse
   */
  checkQuizHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/quiz/health`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Health check for quiz grader service
   * @returns Observable of HealthResponse
   */
  checkGradeHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/grade/health`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Validate file before upload
   * @param file - File to validate
   * @returns boolean indicating if file is valid
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = ['.pdf', '.txt', '.docx'];

    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File too large. Maximum size is 10MB' };
    }

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return { isValid: false, error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}` };
    }

    return { isValid: true };
  }

  /**
   * Calculate score for objective questions (MCQs and True/False)
   * @param userAnswers - User's answers
   * @param correctAnswers - Correct answers
   * @returns Score as percentage
   */
  calculateObjectiveScore(userAnswers: string[] | boolean[], correctAnswers: string[] | boolean[]): number {
    if (userAnswers.length !== correctAnswers.length) {
      return 0;
    }

    let correctCount = 0;
    for (let i = 0; i < userAnswers.length; i++) {
      if (userAnswers[i] === correctAnswers[i]) {
        correctCount++;
      }
    }

    return (correctCount / userAnswers.length) * 100;
  }

  /**
   * Create a grade request object
   * @param userAnswers - User's answers
   * @param quiz - Original quiz
   * @returns GradeRequest object
   */
  createGradeRequest(userAnswers: UserAnswers, quiz: QuizResponse): GradeRequest {
    return {
      user_answers: userAnswers,
      quiz: quiz
    };
  }

  /**
   * Create user answers object from form data
   * @param mcqAnswers - MCQ answers
   * @param tfAnswers - True/False answers
   * @param essayAnswers - Essay answers
   * @returns UserAnswers object
   */
  createUserAnswers(
    mcqAnswers: string[],
    tfAnswers: boolean[],
    essayAnswers: string[]
  ): UserAnswers {
    return {
      mcqs: mcqAnswers,
      true_false: tfAnswers,
      essays: essayAnswers
    };
  }

  /**
   * Handle HTTP errors
   * @param error - HTTP error
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.detail || error.message || `Error Code: ${error.status}`;
    }

    console.error('QuizService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get quiz statistics
   * @param quiz - Quiz response
   * @returns Object with quiz statistics
   */
  getQuizStats(quiz: QuizResponse): {
    totalQuestions: number;
    mcqCount: number;
    tfCount: number;
    essayCount: number;
  } {
    return {
      totalQuestions: quiz.mcqs.length + quiz.true_false.length + quiz.essays.length,
      mcqCount: quiz.mcqs.length,
      tfCount: quiz.true_false.length,
      essayCount: quiz.essays.length
    };
  }

  /**
   * Format score for display
   * @param score - Raw score
   * @returns Formatted score string
   */
  formatScore(score: number): string {
    return `${score.toFixed(1)}%`;
  }

  /**
   * Get difficulty options
   * @returns Array of difficulty options
   */
  getDifficultyOptions(): string[] {
    return ['easy', 'medium', 'hard'];
  }

  /**
   * Get allowed file extensions
   * @returns Array of allowed file extensions
   */
  getAllowedFileExtensions(): string[] {
    return ['.pdf', '.txt', '.docx'];
  }
}
