import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SummaryDataService {
  fileContent: string = '';
  summary: string = '';
}
