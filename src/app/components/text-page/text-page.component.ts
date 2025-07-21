import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Document, Packer, Paragraph ,TextRun } from 'docx';
import { saveAs } from 'file-saver'; // For saving the file
import { TextApiService } from '../../services/text-api.service';
import { TTSApiService } from '../../services/tts-service.service';
import { ThemeService } from '../../services/theme.service';
import { HistoryService } from '../../services/history.service';

// Ensure you have this package installed
@Component({
  selector: 'app-text-page',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,HttpClientModule,FormsModule,RouterLink],
  templateUrl: './text-page.component.html',
  styleUrls: ['./text-page.component.css']
})
export class TextPageComponent {
  userInput = new FormControl('');
  summarizedText = new FormControl('');
  copied: boolean = false;
  isSpeaking : boolean = false;
  isDarkMode: boolean = false;
  isLoading :boolean=true;
  showArabicWarning: boolean = false;
  showTextLengthWarning: boolean = false;
  models = ['Gemini', 'BART Pre Trained','BART Fine Tuned', 'T5 Small','Pegasus'];
  selectedModel: string = ''; // No default selected
  modelSend = this.selectedModel.replace('Model', '').trim();
  selectedType: string = 'summary';
  selectedLength: number = 50;
  gender : string = 'female';
 // Variables for word count
  wordCountUserInput: number = 0;
  wordCountSummarizedText: number = 0;
  showStatsModal: boolean = false;
  sentenceCountUserInput: number = 0;
  sentenceCountSummarizedText: number = 0;
  charCountUserInput: number = 0;
  charCountSummarizedText: number = 0;
  reductionPercent: number = 0;

  audioUrl: string | null = null;
  audioBlob: Blob | null = null;
  audio: HTMLAudioElement | null = null;



  constructor(
    private textApi: TextApiService,
    private ttsApi: TTSApiService,
    private themeservice:ThemeService,
    private historyService: HistoryService
  ) {}

  // method to handle and clean the user input
  cleanUserInput() {
    if (this.userInput.value) {
      this.userInput.setValue(this.userInput.value.trim().replace(/[^a-zA-Z0-9\s.,!?;:()\u24D0-\u24E9\u2460-\u2473\u2800-\u28FF\u2000-\u206F\u25A0-\u25FF\u2030-\u2040]/g, ''));

    }
    // console.log('Cleaned User Input:', this.userInput.value);

  }

  selectModel(model: string) {
    this.selectedModel = model;
  }

  selectType(type: string) {
    this.selectedType = type;
  }

  //return this.selectedType;

  modelToSend(selectedModel: string){
    this.selectedModel = selectedModel;
    if(this.selectedModel === 'BART Pre Trained'){
      this.modelSend = 'bart';
    }
    if(this.selectedModel === 'T5 Small'){
      this.modelSend = 'lora1';
    }
    if(this.selectedModel === 'BART Fine Tuned'){
      this.modelSend = 'lora2';
    }
    return this.modelSend;
  }


  updateValue(event: any) {
    this.selectedLength = event.target.value;
    // console.log('Selected Length:', this.selectedLength);

  }

  // downloadText() {
  //   const text = this.summarizedText?.value;
  //   if (!text || text.trim() === '') {
  //     console.error('No text to download');
  //     return;
  //   }

  //   const doc = new Document({
  //     sections: [
  //       {
  //         properties: {},
  //         children: [new Paragraph(text)],
  //       },
  //     ],
  //   });

  //   Packer.toBlob(doc).then(blob => {
  //     saveAs(blob, 'summary.docx');
  //   }).catch(error => {
  //     console.error('Error generating Word document:', error);
  //   });
  // }
  downloadText() {
      const rawText = this.summarizedText?.value;
      if (!rawText || rawText.trim() === '') {
        console.error('No text to download');
        return;
      }

      // Process lines
      const lines = rawText.split('\n');

      const paragraphs = [];

      for (let line of lines) {
        if (!line.trim()) continue;

        const textRuns: TextRun[] = [];
        let cursor = 0;

        const boldPattern = /\*\*(.*?)\*\*/g; // match **bold**
        const breakPattern = /\*(.*?)\*/g;    // match *text*

        let lastIndex = 0;
        let result;

        // Handle **bold** first
        while ((result = boldPattern.exec(line)) !== null) {
          const [match, boldText] = result;
          const start = result.index;

          if (start > lastIndex) {
            // Add normal text before bold
            textRuns.push(new TextRun(line.slice(lastIndex, start)));
          }

          // Add bold text
          textRuns.push(
            new TextRun({
              text: boldText,
              bold: true,
            })
          );

          // Add \n\n after bold
          textRuns.push(new TextRun('\n\n'));

          lastIndex = start + match.length;
        }

        if (lastIndex < line.length) {
          textRuns.push(new TextRun(line.slice(lastIndex)));
        }

        // If no ** match, check for *text* for line break
        if (textRuns.length === 0) {
          if (breakPattern.test(line)) {
            paragraphs.push(new Paragraph(line));
            paragraphs.push(new Paragraph('')); // single \n
            continue;
          }
        }

        paragraphs.push(new Paragraph({ children: textRuns }));
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, 'summary.docx');
      }).catch(error => {
        console.error('Error generating Word document:', error);
      });
    }


  ngOnInit() {

    // Initialize word count calculation when the component is loaded
    this.updateWordCountUserInput();
    this.updateWordCountSummarizedText();
  }

  // Method to update word count for user input
  updateWordCountUserInput() {
    const text = this.userInput.value || '';
    this.wordCountUserInput = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.sentenceCountUserInput = text.trim() ? text.trim().split(/[.!?]+/).filter(Boolean).length : 0;
    this.charCountUserInput = text.length;
    this.updateReductionPercent();
  }

  // Method to update word count for summarized text
  updateWordCountSummarizedText() {
    const text = this.summarizedText.value || '';
    this.wordCountSummarizedText = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.sentenceCountSummarizedText = text.trim() ? text.trim().split(/[.!?]+/).filter(Boolean).length : 0;
    this.charCountSummarizedText = text.length;
    this.updateReductionPercent();
  }

  updateReductionPercent() {
    this.reductionPercent = this.wordCountUserInput > 0 ? Math.round(100 * (this.wordCountUserInput - this.wordCountSummarizedText) / this.wordCountUserInput) : 0;
  }

  // Save summary to backend
  private saveSummaryToHistory(originalText: string, summary: string): void {
    const topic = this.generateTopic(originalText);
    this.historyService.addTextSummary({
      Text: originalText,
      Summary: summary,
      Topic: topic
    }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          console.log('Summary saved to history successfully');
        } else {
          console.error('Failed to save summary to history:', response.message);
        }
      },
      error: (err) => {
        console.error('Error saving summary to history:', err);
      }
    });
  }

  // Generate a topic from the original text (for display purposes only)
  private generateTopic(text: string): string {
    // Take first 50 characters and clean them up
    const firstWords = text.substring(0, 50).trim();
    if (firstWords.length < 50) {
      return firstWords;
    }
    // Find the last complete word within 50 characters
    const lastSpaceIndex = firstWords.lastIndexOf(' ');
    if (lastSpaceIndex > 0) {
      return firstWords.substring(0, lastSpaceIndex) + '...';
    }
    return firstWords + '...';
  }

  // Format bullet points in a professional way
  private formatBulletPoints(text: string): string {
    if (!text) return text;

    // Split the text into lines
    const lines = text.split('\n');
    const formattedLines: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Remove asterisks and clean up the line
      let cleanedLine = line.replace(/^\s*[\*\-•]\s*/, '').trim();

      // If the line starts with common bullet point patterns, format it
      if (cleanedLine.length > 0) {
        // Capitalize the first letter
        cleanedLine = cleanedLine.charAt(0).toUpperCase() + cleanedLine.slice(1);

        // Ensure the line ends with proper punctuation
        if (!cleanedLine.match(/[.!?]$/)) {
          cleanedLine += '.';
        }

        // Add bullet point symbol
        formattedLines.push(`• ${cleanedLine}`);
      }
    }

    // Join lines with proper spacing
    return formattedLines.join('\n\n');
  }


  submitText(event: Event): void {
  event.preventDefault();

  const text = this.userInput.value?.trim() || '';

  // 1) Check if Arabic
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(text)) {
    this.showArabicWarning = true;
    this.summarizedText.setValue('');
    this.wordCountSummarizedText = 0;
    return;
  }

  // 2) Check word count
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 10) {
    this.showTextLengthWarning = true;
    this.summarizedText.setValue('');
    this.wordCountSummarizedText = 0;
    return;
  }

  // 3) Clean up and prepare
  this.showTextLengthWarning = false;
  this.showArabicWarning = false;
  this.isLoading = false;
  this.cleanUserInput();
  this.updateWordCountUserInput();

  // 4) Summarize only
  const model = this.modelToSend(this.selectedModel) || 'gemini';
  const format = this.selectedType || 'bullet';


  this.textApi.summarize(text, model, format).subscribe({

    next: (res) => {
      let formattedSummary = res.summary;

      // Format bullet points if bullet type is selected
      if (this.selectedType === 'bullet') {
        formattedSummary = this.formatBulletPoints(res.summary);
      }

      this.summarizedText.setValue(formattedSummary);
      this.isLoading = true;
      this.updateWordCountSummarizedText();

      // Save summary to history
      this.saveSummaryToHistory(text, formattedSummary);
    },
    error: (err) => {
      console.error('Error:', err);
      this.summarizedText.setValue('Error fetching summary.');
      this.isLoading = true;
      this.updateWordCountSummarizedText();
    }
  });
}


  closeWarning(): void {
    this.showTextLengthWarning = false;
    this.showArabicWarning = false;
    this.showStatsModal = false;
  }

  clearText() {
    this.userInput.setValue('');
    this.summarizedText.setValue('');
    this.wordCountUserInput = 0;
    this.wordCountSummarizedText = 0;
    this.selectedType = 'summary';
  }

  exampleText($event: Event) {
    $event.preventDefault();
this.userInput.setValue(`Full Project Description:
Project Title: Smart Book Assistant – Text Summarization, TTS, Chatbot & Exam Generation

This project is an integrated AI-powered educational assistant designed to simplify learning and studying through a collection of smart tools built using modern technologies in natural language processing (NLP), machine learning, and web development.

🔹 1. Text & Book Summarization
The system includes a powerful text summarization module that can take long passages of text or entire book contents and generate concise, meaningful summaries. This is useful for students who need to quickly understand key ideas, researchers reviewing lengthy documents, or general readers looking for efficient comprehension.

🔹 2. Text-to-Speech (TTS) System
To enhance accessibility and user convenience, the platform features a TTS engine that converts written content into spoken audio. Whether it's a summarized paragraph, a chapter, or an entire page, users can listen to the content instead of reading it. This helps visually impaired users and supports auditory learners who retain information better through hearing.

🔹 3. Chatbot Integration
The system incorporates a chatbot that serves as a virtual assistant, capable of answering questions, explaining content, guiding users through the interface, and responding to queries based on uploaded content. The chatbot mimics human-like interactions and provides real-time assistance, making learning more interactive and engaging.

🔹 4. Uploaded Document-Based Exam Generation
One of the standout features of the project is the intelligent exam generator. Users can upload any document (such as PDF or Word files), and the system will automatically generate quiz questions from the text. This makes it an ideal tool for teachers preparing tests or students wanting to test their comprehension of a given reading.

🔹 5. Online Quiz Platform
  The generated quizzes are displayed in an interactive online format where users can take the exam, submit answers, and get instant results. It includes multiple-choice questions (MCQs), short answer questions, and more, helping to reinforce learning through self-assessment.`);

    this.summarizedText.setValue(`📝 Summary Text (Short Version):
    A full-stack AI-powered educational platform that includes text and book summarization, text-to-speech, an intelligent chatbot, document-based exam generation, and an interactive online quiz system. Built using NLP models like BART and T5-small, with FastAPI backend and Angular frontend, the platform aims to enhance learning efficiency, accessibility, and engagement.`);

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


  toggleSpeech(): void {
  if (this.isSpeaking) {
    this.stopSpeech();
    return;
  }

  const text = this.summarizedText.value?.trim();
  if (!text) return;

  this.isSpeaking = true;

  this.ttsApi.convertTextToSpeech({
    text: text,
    gender: this.gender, // Or allow the user to choose
    rate: 150,
    volume: 1.0
  }).subscribe({
    next: ttsRes => {
      this.ttsApi.downloadAudio(ttsRes.filename).subscribe(blob => {
        this.audioUrl = URL.createObjectURL(blob);
        this.audio = new Audio(this.audioUrl);

        this.audio.play();
        this.audio.onended = () => {
          this.isSpeaking = false;
        };
        this.audio.onerror = () => {
          this.isSpeaking = false;
          console.error("Failed to play audio.");
        };
      });
    },
    error: err => {
      this.isSpeaking = false;
      console.error('Error with TTS:', err);
    }
  });
}

  stopSpeech(): void {
  if (this.audio) {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  this.isSpeaking = false;
}


  changeGender(gender : string): void {
    this.gender = gender;

  }
  getTheme(){
    return this.themeservice.getTheme();
  }

}
