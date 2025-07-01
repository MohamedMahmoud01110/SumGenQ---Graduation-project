import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // ✅ this is correct
})
export class SpeechService {
  private apiUrl = 'http://127.0.0.1:5000/api/speak';


  constructor(private http: HttpClient) {}

  generateSpeech(text: string, voice: string): Observable<any> {
    return this.http.post(this.apiUrl, { text, voice }, { responseType: 'blob' });
  }
}
