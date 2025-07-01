import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface TTSRequest {
  text: string;
  gender?: string;
  rate?: number;
  volume?: number;
}

interface TTSResponse {
  message: string;
  file_path: string;
  filename: string;
}

@Injectable({
  providedIn: 'root'
})
export class TTSApiService {
  private baseUrl = 'http://localhost:8001';  // ✅ updated from 8000 to 8001

  constructor(private http: HttpClient) {}

  // ✅ Correct endpoint: /tts (not /voices)
  convertTextToSpeech(request: TTSRequest): Observable<TTSResponse> {
    return this.http.post<TTSResponse>(`${this.baseUrl}/tts`, request);
  }

  // ✅ Correct download path
  downloadAudio(filename: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${filename}`, {
      responseType: 'blob'
    });
  }

  // (Optional) Fetch voices from backend if needed
  getAvailableVoices(): Observable<any> {
    return this.http.get(`${this.baseUrl}/voices`);
  }
}
