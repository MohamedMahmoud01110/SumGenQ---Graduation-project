import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BookSummaryResponse {
  summary: string;
  metadata?: {
    processing_time_seconds?: number;
    word_count?: number;
    [key: string]: any;
  };
  status: string;
}

export interface DocumentAnalysisResponse {
  analysis: {
    file_metadata: any;
    document_metadata: any;
    text_preview: string;
    processing_recommendations: string;
  };
  status: string;
}

export interface URLRequest {
  url: string;
  custom_instruction?: string;
  user_id?: string;
}

export interface URLSummaryResponse {
  summary: string;
  metadata?: {
    instruction_used?: string;
    processing_time_seconds?: number;
    document_info?: {
      word_count?: number;
      [key: string]: any;
    };
    url_info?: {
      title?: string;
      author?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  status: string;
}

export interface ChatRequest {
  file: File;
  question: string;
}

export interface ChatResponse {
  answer: string;
  message?: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookApiService {
  private baseUrl = 'http://127.0.0.1:8002';

  constructor(private http: HttpClient) {}

  // File summarization - using legacy endpoint for compatibility
  summarizeBook(file: File): Observable<BookSummaryResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BookSummaryResponse>(`${this.baseUrl}/summarize-file`, formData);
  }

  // URL summarization only
  summarizeUrl(urlRequest: URLRequest): Observable<URLSummaryResponse> {
    return this.http.post<URLSummaryResponse>(`${this.baseUrl}/process-url`, urlRequest);
  }

  // Chat with document - using legacy endpoint
  chatWithDocument(file: File, question: string): Observable<ChatResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', question);
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, formData);
  }

  // Document analysis (file only, no URL analysis)
  analyzeDocument(file: File): Observable<DocumentAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentAnalysisResponse>(`${this.baseUrl}/analyze-document`, formData);
  }

  // Health check
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // Get configuration
  getConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/config`);
  }
}
