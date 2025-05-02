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
  copied: boolean = false;

  // Variables for word count
  wordCountUserInput: number = 0;
  wordCountSummarizedText: number = 0;

  ngOnInit() {
    // Initialize word count calculation when the component is loaded
    this.updateWordCountUserInput();
    this.updateWordCountSummarizedText();
  }

  // Method to update word count for user input
  updateWordCountUserInput() {
    const text = this.userInput.value?.trim();
    this.wordCountUserInput = text ? text.split(/\s+/).length : 0;
  }

  // Method to update word count for summarized text
  updateWordCountSummarizedText() {
    const text = this.summarizedText.value?.trim();
    this.wordCountSummarizedText = text ? text.split(/\s+/).length : 0;
  }

  submitText(event: Event) {
    event.preventDefault();
    this.summarizedText.setValue(this.userInput.value);
    console.log(this.userInput.value);

    // Update word count after submitting text
    this.updateWordCountUserInput();
    this.updateWordCountSummarizedText();
  }

  clearText() {
    this.userInput.setValue('');
    this.summarizedText.setValue('');
    this.wordCountUserInput = 0;
    this.wordCountSummarizedText = 0;
  }

  exampleText($event: Event) {
    $event.preventDefault();
    this.userInput.setValue('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.');
    this.summarizedText.setValue('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');

    // Update word count after setting example text
    this.updateWordCountUserInput();
    this.updateWordCountSummarizedText();
  }

  copyText() {
    const textToCopy = this.summarizedText.value!;  // Ensure there's text to copy

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('Text copied to clipboard');
        console.log(textToCopy);

        // Set copied state to true to change the image to the check mark
        this.copied = true;

        // Revert the icon back to copy after 2 seconds
        setTimeout(() => {
          this.copied = false;
        }, 2000);  // Adjust the delay as needed (2000 ms = 2 seconds)
      }).catch(err => {
        console.error('Error copying text: ', err);
      });
    }
  }
}
