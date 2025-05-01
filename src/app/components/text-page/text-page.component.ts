import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './text-page.component.html',
  styleUrls: ['./text-page.component.css']
})
export class TextPageComponent {
  userInput = new FormControl('');
  summarizedText = new FormControl('');


  submitText(event: Event) {
    event.preventDefault();
    this.summarizedText.setValue(this.userInput.value);
    console.log(this.userInput.value);
  }
  clearText() {
    this.userInput.setValue('');
    this.summarizedText.setValue('');
  }
  exampleText($event: Event) {
    $event.preventDefault();
    this.userInput.setValue('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.');
    this.summarizedText.setValue('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');


  }


}
