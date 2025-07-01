import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SummaryDataService } from '../../services/summary-data.service';

@Component({
  selector: 'app-summary-result',
  templateUrl: './summary-result.component.html',
  styleUrls: ['./summary-result.component.css']
})
export class SummaryResultComponent {
    constructor(public summaryService: SummaryDataService) {}

}
