import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'validation-messages',
  imports: [],
  templateUrl: './validation-messages.component.html',
  styleUrl: './validation-messages.component.css'
})
export class ValidationMessagesComponent {
@Input() controls!: AbstractControl | null
}
