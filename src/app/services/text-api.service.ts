import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface SummarizeResponse {
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class TextApiService {
  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  summarize(text: string, model_name: string,format:string): Observable<SummarizeResponse> {
    return this.http.post<SummarizeResponse>(`${this.baseUrl}/summarize/`, {
      text,
      min_length: 30,
      max_length: 130,
      model_name: model_name,
      format:  format,
    });
  }
}
