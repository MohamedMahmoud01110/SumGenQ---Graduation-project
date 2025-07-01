// book-summary-viewer.component.ts
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookApiService, BookSummaryResponse, ChatResponse } from '../../services/book-api.service';
import { FileUploadService } from '../../services/file-upload.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TTSApiService } from '../../services/tts-service.service';
import { Document, Packer, Paragraph,TextRun } from 'docx';
import saveAs from 'file-saver';
import { ThemeService } from '../../services/theme.service';
import { HistoryService } from '../../services/history.service';

@Component({
  selector: 'app-book-summary-viewer',
  templateUrl: './book-summary-viewer.component.html',
  imports:[CommonModule,FormsModule,RouterLink],
  styleUrls: ['./book-summary-viewer.component.css']
})
export class BookSummaryViewerComponent implements OnInit, OnDestroy {
  @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLIFrameElement>;
  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('questionInput') questionInput!: ElementRef<HTMLInputElement>;

  // Data properties
  summaryResult: BookSummaryResponse | null = null;
  file: File | null = null;
  fileUrl: string | null = null;
  fileName: string = '';
  copied: boolean = false;
  isSpeaking : boolean = false;
  wordCountSummarizedText: number = 0;
  showEmptyTextWarning: boolean = false;
  audioUrl: string | null = null;
  audioBlob: Blob | null = null;
  audio: HTMLAudioElement | null = null;
  gender : string = 'female';
  bookSummaryId: number | null = null;

  // Chat properties
  chatMessages: any[] = [];
  currentQuestion: string = '';
  isLoadingChat: boolean = false;
  showChat: boolean = true;

  showStatsModal: boolean = false;
  wordCountOriginalText: number = 0;
  sentenceCountOriginalText: number = 0;
  charCountOriginalText: number = 0;
  sentenceCountSummarizedText: number = 0;
  charCountSummarizedText: number = 0;
  reductionPercent: number = 0;

  constructor(
    private router: Router,
    private bookApi: BookApiService,
    private fileUploadService: FileUploadService,
    private ttsApi:TTSApiService,
    private themeservice : ThemeService,
    private historyService: HistoryService
  ) {}

  ngOnInit() {
    console.log('=== DEBUG INIT ===');

    // Get data from service
    this.file = this.fileUploadService.getFile();
    this.fileUrl = this.fileUploadService.getFileUrl();
    this.summaryResult = this.fileUploadService.getSummary();

    console.log('Service data:', {
      hasFile: !!this.file,
      hasFileUrl: !!this.fileUrl,
      hasSummary: !!this.summaryResult
    });

    if (this.file && this.summaryResult) {
      this.fileName = this.file.name;
      console.log('✅ All data found in service:', {
        fileName: this.fileName,
        hasSummary: !!this.summaryResult
      });

      // Save summary to history
      this.saveBookSummaryToHistory();
      this.updateStats();
    } else {
      console.log('❌ Missing data in service:', {
        hasFile: !!this.file,
        hasSummary: !!this.summaryResult
      });
      // Redirect back to upload page
      this.router.navigate(['/book']);
    }
    this.updateWordCountSummarizedText();
  }

  // Save book summary to backend
  private saveBookSummaryToHistory(): void {
    if (!this.summaryResult?.summary || !this.fileName) {
      return;
    }

    const topic = this.generateTopic(this.summaryResult.summary);
    this.historyService.addBookSummary({
      Book: this.fileName,
      Summary: this.summaryResult.summary,
      Topic: topic
    }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // Fetch all book summaries to get the ID
          this.historyService.getBookSummaries().subscribe({
            next: (res) => {
              if (res.status === 'success' && Array.isArray(res.data)) {
                const found = res.data.find((b: any) => b.Book === this.fileName);
                if (found) {
                  this.bookSummaryId = found.id;
                }
              }
            }
          });
        }
      }
    });
  }

  // Generate a topic from the summary (for display purposes only)
  private generateTopic(summary: string): string {
    // Take first 50 characters and clean them up
    const firstWords = summary.substring(0, 50).trim();
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

  ngAfterViewInit() {
    // Set PDF URL after view is initialized
    if (this.fileUrl && this.pdfViewer) {
      this.pdfViewer.nativeElement.src = this.fileUrl;
    }
  }

  ngOnDestroy() {
    // Don't clear here as user might want to chat
  }

  // Chat methods
  askQuestion() {
    console.log('=== DEBUG CHAT ===');
    console.log('Current question:', this.currentQuestion);
    console.log('File available:', !!this.file);
    console.log('File name:', this.fileName);

    if (!this.currentQuestion.trim() || this.isLoadingChat) {
      this.showEmptyTextWarning = true;
      return;
    }
    if(this.currentQuestion.trim() === ''){
      this.currentQuestion = '';
      this.showEmptyTextWarning = true;
    }
    else{
      this.showEmptyTextWarning = false;
    }


    if (!this.file) {
      this.addMessage('assistant', 'No file available for chat. Please re-upload the document.');
      return;
    }

    // Add user message
    this.addMessage('user', this.currentQuestion);
    const question = this.currentQuestion;
    this.currentQuestion = '';
    this.isLoadingChat = true;

    // Send the actual file with the question
    this.bookApi.chatWithDocument(this.file, question).subscribe({
      next: (response: ChatResponse) => {
        this.isLoadingChat = false;
        const answer: string = response.answer || response.message || 'No response received';
        this.addMessage('assistant', answer);
        // Save chat to backend using the stored bookSummaryId
        if (this.bookSummaryId) {
          this.historyService.addChat({
            BookId: this.bookSummaryId,
            Question: question,
            Answer: answer
          }).subscribe();
          console.log('Chat saved to history:', {
            bookSummaryId: this.bookSummaryId,
            question,
            answer
          });

        }
        this.scrollToBottom();
      },
      error: (error: any) => {
        this.isLoadingChat = false;
        console.error('Chat error:', error);
        this.addMessage('assistant', 'Sorry, I encountered an error while processing your question.');
        this.scrollToBottom();
      }
    });
  }

  addMessage(type: 'user' | 'assistant' | 'system', content: string) {
    this.chatMessages.push({
      type,
      content,
      timestamp: new Date()
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatMessagesContainer) {
        this.chatMessagesContainer.nativeElement.scrollTop =
          this.chatMessagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  handleQuestionKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.askQuestion();
    }
  }

  toggleChat() {
    this.showChat = !this.showChat;
  }

  closeSummary() {
    // Clear all data when leaving
    this.fileUploadService.clearAll();
    this.router.navigate(['/book']);
  }
  copyText() {
    const textToCopy = this.summaryResult?.summary;  // Ensure there's text to copy
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

  const text = this.summaryResult?.summary?.trim();
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

  changeGender(gender : string): void {
    this.gender = gender;

  }
  stopSpeech(): void {
  if (this.audio) {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  this.isSpeaking = false;
}

  closeWarning(): void {
    this.showEmptyTextWarning = false;
  }

  downloadText() {
    const rawText = this.summaryResult?.summary;
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

  getTheme(){
    return this.themeservice.getTheme();
  }

  updateWordCountSummarizedText() {
    const text = this.summaryResult?.summary?.trim();
    this.wordCountSummarizedText = text ? text.split(/\s+/).length : 0;
  }

  updateStats() {
    const original = this.fileUploadService.getFile() ? this.fileUploadService.getFile() : null;
    const originalText = this.summaryResult && (this.summaryResult as any).originalText ? (this.summaryResult as any).originalText : '';
    // Try to get the original text from a property or service
    // Fallback: use file content if available
    let origText = '';
    if (originalText) {
      origText = originalText;
    } else if (this.file && (this.file as any).textContent) {
      origText = (this.file as any).textContent;
    } else {
      origText = '';
    }
    const summarized = this.summaryResult?.summary || '';
    this.wordCountOriginalText = origText.trim() ? origText.trim().split(/\s+/).length : 0;
    this.wordCountSummarizedText = summarized.trim() ? summarized.trim().split(/\s+/).length : 0;
    this.sentenceCountOriginalText = origText.trim() ? origText.trim().split(/[.!?]+/).filter(Boolean).length : 0;
    this.sentenceCountSummarizedText = summarized.trim() ? summarized.trim().split(/[.!?]+/).filter(Boolean).length : 0;
    this.charCountOriginalText = origText.length;
    this.charCountSummarizedText = summarized.length;
    this.reductionPercent = this.wordCountOriginalText > 0 ? Math.round(100 * (this.wordCountOriginalText - this.wordCountSummarizedText) / this.wordCountOriginalText) : 0;
  }
}
