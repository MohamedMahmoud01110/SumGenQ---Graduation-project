import { Injectable } from '@angular/core';
import { BookSummaryResponse } from './book-api.service';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private _file: File | null = null;
  private _fileUrl: string | null = null;
  private _summary: BookSummaryResponse | null = null;
  private _inputUrl: string | null = null;

  setFile(file: File) {
    this._file = file;
    this._fileUrl = URL.createObjectURL(file);
  }

  setUrl(url: string) {
    this._inputUrl = url;
  }

  setSummary(summary: BookSummaryResponse) {
    this._summary = summary;
  }

  getFile(): File | null {
    return this._file;
  }

  getFileUrl(): string | null {
    return this._fileUrl;
  }

  getInputUrl(): string | null {
    return this._inputUrl;
  }

  getSummary(): BookSummaryResponse | null {
    return this._summary;
  }

  clearAll() {
    if (this._fileUrl) {
      URL.revokeObjectURL(this._fileUrl);
    }
    this._file = null;
    this._fileUrl = null;
    this._summary = null;
    this._inputUrl = null;
  }
}
