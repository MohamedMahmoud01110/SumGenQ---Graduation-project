import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { BookApiService, BookSummaryResponse, DocumentAnalysisResponse, URLRequest, URLSummaryResponse } from '../../services/book-api.service';
import { ThemeService } from '../../services/theme.service';
import { FileUploadService } from './../../services/file-upload.service';
// Set the workerSrc to the CDN or local path for pdf.worker.min.js
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';


@Component({
  selector: 'app-book-page',
  imports: [CommonModule,RouterLink,FormsModule],
  templateUrl: './book-page.component.html',
  styleUrl: './book-page.component.css'
})
export class BookPageComponent {
  selectedFile: File | null = null;
  summarizedText = '';
  isLoadingSumamry = false;
  isLoadingAnalysis = false;
  theme ='';
  error = '';
  showNoFileWarning: boolean = false;
  isToggled = 0;
  showUnsupportedFileWarning = false;
  analysisResult: any = null;
  processingTimeMs: number = 0;
  summaryResult: BookSummaryResponse | null = null;
  @ViewChild('fileInput') fileInput: any;
  // URL-related properties
  showUrlModal: boolean = false;
  urlInput: string = '';
  isLoadingUrl: boolean = false;
  // fileUploadService: any;

  constructor(
    private bookApi: BookApiService,
    private router: Router,
    public fileUploadService: FileUploadService,
    private themeservice : ThemeService) { }

  private handleSummaryResponse(res: any): void {
    if (res && res.status === 'success') {
      // First, get the full summary using the document_id
      if (res.document_id) {
        this.bookApi.getFullSummary(res.document_id).subscribe({
          next: (fullSummaryRes) => {
            console.log("Full summary response:", fullSummaryRes);

            // Use the full summary from the detailed endpoint
            const fullSummary = fullSummaryRes?.summary?.main_summary ||
                               fullSummaryRes?.summary ||
                               res.summary_preview ||
                               'Summary not available';

            const summaryData = {
              summary: fullSummary,
              status: res.status,
              session_id: res.session_id,
              metadata: {
                processing_time_seconds: res.processing_time,
                word_count: res.word_count,
                document_id: res.document_id,
                filename: res.filename
              }
            };
            this.fileUploadService.setSummary(summaryData);
            console.log("Full summary result:", summaryData);
            this.router.navigate(['/summary']);
          },
          error: (err) => {
            console.error("Error getting full summary:", err);
            // Fallback to preview if full summary fails
            const summaryData = {
              summary: res.summary_preview || res.summary || 'Summary not available',
              status: res.status,
              session_id: res.session_id,
              metadata: {
                processing_time_seconds: res.processing_time,
                word_count: res.word_count,
                document_id: res.document_id,
                filename: res.filename
              }
            };
            this.fileUploadService.setSummary(summaryData);
            console.log("Fallback summary result:", summaryData);
            this.router.navigate(['/summary']);
          }
        });
      } else {
        // Fallback if no document_id
        const summaryData = {
          summary: res.summary_preview || res.summary || 'Summary not available',
          status: res.status,
          session_id: res.session_id,
          metadata: {
            processing_time_seconds: res.processing_time,
            word_count: res.word_count,
            document_id: res.document_id,
            filename: res.filename
          }
        };
        this.fileUploadService.setSummary(summaryData);
        console.log("Summary result:", res);
        this.router.navigate(['/summary']);
      }
    } else {
      console.error("Invalid response structure:", res);
      this.error = 'Invalid response from server';
    }
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.theme = this.themeservice.getTheme();
    this.themeservice.theme$.subscribe((theme) => {
      this.theme = theme;
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
  triggerFileInput(event?: Event): void {
    if (this.fileInput) {
      event?.stopPropagation();
      this.fileInput.nativeElement.click();
    }
  }
  onFileSelected(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  if (!target || !target.files || !target.files[0]) {
    return;
  }

  const file = target.files[0];
  if (file) {
    // Check if file is supported first
    if (!this.isSupportedFile(file)) {
      this.showUnsupportedFileWarning = true;
      return;
    }

    // Set the file and store in service
    this.selectedFile = file;
    this.fileUploadService.setFile(file);

    // Clear any previous errors
    this.error = '';
    this.showUnsupportedFileWarning = false;

    console.log('File selected and stored:', file.name);
  }
}
  private isSupportedFile(file: File): boolean {
    const allowedTypes = [
      'application/pdf', // PDF
      'application/msword', // Word
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word (OpenXML)
      'text/plain' // .txt
    ];

    if (!allowedTypes.includes(file.type)) {
      this.error = 'Unsupported file type';
      this.showUnsupportedFileWarning = true;
      console.log('Unsupported file type:', file.type);
      return false;
    }

    if (file.size > 25 * 1024 * 1024) {
      this.error = 'File exceeds 25 MB size limit';
      this.showUnsupportedFileWarning = true;
      return false;
    }

    this.showUnsupportedFileWarning = false;
    console.log('File:', file.name, 'Type:', file.type, 'Size:', file.size);
    return true;

  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const box = event.currentTarget as HTMLElement;
    box.classList.remove('dragover');
    const file = event.dataTransfer?.files?.[0];
    if (file && this.isSupportedFile(file)) {
      this.selectedFile = file;
      this.error = '';
    }
  }
  onDragOver(event: DragEvent) {
    // event.preventDefault();
    // event.stopPropagation();
    // Optional: add a CSS class to highlight the drop zone
    event.preventDefault();
    event.stopPropagation();
    // Optional: Add visual effect
    const box = event.currentTarget as HTMLElement;
    box.classList.add('dragover');
  }
  removeFile(): void {
    this.selectedFile = null;
    this.summarizedText = '';
    this.showUnsupportedFileWarning = false;
    this.fileUploadService.clearAll();
  }

  onDragLeave(event: DragEvent) {
    // event.preventDefault();
    // event.stopPropagation();
    // Optional: remove highlight class
      event.preventDefault();
    event.stopPropagation();
    // Optional: Remove visual effect
    const box = event.currentTarget as HTMLElement;
    box.classList.remove('dragover');
  }


  processFile(file: File) {
    // ✅ تعامل مع الملف هنا
    console.log("File dropped or selected:", file);
    // Add your logic to read or upload the file
  }

// activeTab: string = 'upload';
  onAskExam(): void {
    this.isToggled += 1;
    if(this.isToggled %2 === 0) {
      this.isToggled = 0;
      console.log("Exam request cancelled");

    }
    else {
      this.isToggled = 1;
    console.log("Exam request triggered");
    }

  }



  closeWarning(): void {
    this.showNoFileWarning = false;
    this.showUnsupportedFileWarning = false;

  }
  closeAnalysis(): void {
    this.analysisResult = null;
    this.fileUploadService.clearAll();
  }

  // URL-related methods
  openUrlModal(event: Event): void {
    // if (this.fileInput) {
    //   event?.stopPropagation();
    //   this.fileInput.nativeElement.click();
    // }
    event.stopPropagation();
    this.showUrlModal = true;
    this.urlInput = '';
  }

  closeUrlModal(): void {
    this.showUrlModal = false;
    this.urlInput = '';
    this.isLoadingUrl = false;
  }

  async processUrl(): Promise<void> {
    if (!this.urlInput || this.isLoadingUrl) {
      return;
    }

    // Basic URL validation
    try {
      new URL(this.urlInput);
    } catch {
      this.error = 'Please enter a valid URL';
      return;
    }

    this.isLoadingUrl = true;

    try {
      // Create a mock file object from URL for UI consistency
      const fileName = this.urlInput.split('/').pop() || 'document.pdf';
      const mockFile = new File([''], fileName, { type: 'application/pdf' });

      // Set the file and store in service
      this.selectedFile = mockFile;
      this.fileUploadService.setFile(mockFile);

      // Store URL for processing
      this.fileUploadService.setUrl(this.urlInput);


      this.closeUrlModal();
      this.error = '';

      console.log('URL processed:', this.urlInput);
    } catch (error) {
      this.error = 'Failed to process URL';
      console.error('Error processing URL:', error);
    } finally {
      this.isLoadingUrl = false;
    }
  }

  // New method for URL summarization
  summarizeUrl(): void {
    const url = this.fileUploadService.getInputUrl();
    if (!url) {
      this.showNoFileWarning = true;
      return;
    }

    this.isLoadingSumamry = true;
    this.summarizedText = '';

    const urlRequest: URLRequest = {
      url: url
    };

    this.bookApi.summarizeUrl(urlRequest).subscribe({
      next: (res: URLSummaryResponse) => {
        this.isLoadingSumamry = false;
        this.handleSummaryResponse(res);
      },
      error: (err: any) => {
        this.isLoadingSumamry = false;
        if (err.status === 0 || err.statusText === 'Unknown Error') {
          this.error = 'Backend server is not running. Please start the server at http://127.0.0.1:8000';
        } else {
          this.error = 'Error summarizing the URL.';
        }
        console.error(err);
      }
    });
  }

  // New method for URL analysis
  // async analyzeUrl(): Promise<void> {
  //   const url = this.fileUploadService.getInputUrl();
  //   if (!url) {
  //     this.showNoFileWarning = true;
  //     return;
  //   }

  //   this.isLoadingAnalysis = true;
  //   this.error = '';
  //   this.analysisResult = null;

  //   const startTime = Date.now();

  //   this.bookApi.analyzeUrl(url).subscribe({
  //     next: (data: URLAnalysisResponse) => {
  //       this.analysisResult = data;
  //       this.processingTimeMs = Date.now() - startTime;
  //       console.log('URL Analysis complete in', this.processingTimeMs, 'ms');
  //       this.isLoadingAnalysis = false;
  //     },
  //     error: (error: any) => {
  //       this.isLoadingAnalysis = false;
  //       if (error.status === 0 || error.statusText === 'Unknown Error') {
  //         this.error = 'Backend server is not running. Please start the server at http://127.0.0.1:8000';
  //       } else {
  //         this.error = 'Error analyzing the URL.';
  //       }
  //       console.error('Analysis error:', error);
  //     }
  //   });
  // }

  summarizeBook(): void {
    // Check if we have a URL input
    const url = this.fileUploadService.getInputUrl();
    if (url) {
      this.summarizeUrl();
      return;
    }

    // Check if we have a file
    if (!this.selectedFile) {
      this.showNoFileWarning = true;
      return;
    }

    this.isLoadingSumamry = true;
    this.summarizedText = '';

    const file = this.selectedFile;
    const fileType = file.type;

    const reader = new FileReader();

    if (fileType === 'application/pdf') {
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

        loadingTask.promise.then((pdf) => {
          const numPages = pdf.numPages;
          const pagePromises = [];

          for (let i = 1; i <= numPages; i++) {
            pagePromises.push(pdf.getPage(i).then(page => page.getTextContent()));
          }

          Promise.all(pagePromises).then((pages) => {
            const fullText = pages
              .map((pageContent: any) =>
                pageContent.items.map((item: any) => item.str).join(' ')
              )
              .join('\n\n');

                        // ✅ Send file to backend for summarization
            this.bookApi.summarizeBook(file).subscribe({
              next: (res) => {
                this.isLoadingSumamry = false;
                console.log("Raw response from API:", res);
                console.log("Response type:", typeof res);
                console.log("Response keys:", res ? Object.keys(res) : 'res is null/undefined');
                this.handleSummaryResponse(res);
              },
              error: (err: any) => {
                this.isLoadingSumamry = false;
                console.error("Full error object:", err);
                console.error("Error status:", err.status);
                console.error("Error message:", err.message);
                console.error("Error text:", err.statusText);

                if (err.status === 0 || err.statusText === 'Unknown Error') {
                  this.error = 'Backend server is not running. Please start the server at http://127.0.0.1:8002';
                } else {
                  this.error = `Error summarizing the book: ${err.status} ${err.statusText}`;
                }
                console.error(err);
              }
            });
          });
        });
      };
      reader.readAsArrayBuffer(file);

    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;

        mammoth.extractRawText({ arrayBuffer }).then((result) => {
          console.log('DOCX raw text:', result.value);

          // ✅ Send original file to backend
          this.bookApi.summarizeBook(file).subscribe({
            next: (res) => {
              this.isLoadingSumamry = false;
              this.handleSummaryResponse(res);
            },
            error: (err: any) => {
              this.isLoadingSumamry = false;
              if (err.status === 0 || err.statusText === 'Unknown Error') {
                this.error = 'Backend server is not running. Please start the server at http://127.0.0.1:8000';
              } else {
                this.error = 'Error summarizing the book.';
              }
              console.error(err);
            }
          });
        }).catch((err) => {
          console.error('Error reading DOCX:', err);
          this.error = 'Error reading DOCX file.';
          this.isLoadingSumamry = false;
        });
      };
      reader.readAsArrayBuffer(file);

    } else if (fileType === 'text/plain') {
      reader.onload = () => {
        const text = reader.result as string;
        console.log('TXT content:', text);

        // ✅ Send original file to backend
        this.bookApi.summarizeBook(file).subscribe({
          next: (res) => {
            this.isLoadingSumamry = false;
            this.handleSummaryResponse(res);
          },
          error: (err: any) => {
            this.isLoadingSumamry = false;
            if (err.status === 0 || err.statusText === 'Unknown Error') {
              this.error = 'Backend server is not running. Please start the server at http://127.0.0.1:8000';
            } else {
              this.error = 'Error summarizing the book.';
            }
            console.error(err);
          }
        });
      };
      reader.readAsText(file);

    } else if (fileType === 'application/msword') {
      // No need to read, just send to backend
      this.bookApi.summarizeBook(file).subscribe({
        next: (res) => {
          this.isLoadingSumamry = false;
          this.handleSummaryResponse(res);
        },
        error: (err: any) => {
          this.isLoadingSumamry = false;
          if (err.status === 0 || err.statusText === 'Unknown Error') {
            this.error = 'Backend server is not running. Please start the server at http://127.0.0.1:8000';
          } else {
            this.error = 'Error summarizing the book.';
          }
          console.error(err);
        }
      });

    } else {
      this.error = 'Unsupported file type.';
      this.showUnsupportedFileWarning = true;
      this.isLoadingSumamry = false;
    }
  }


// summarizeBook(): void {
//   if (!this.selectedFile) {
//     this.showTextLengthWarning = true;
//     return;
//   }

//   this.isLoadingSumamry = true;
//   this.summarizedText = '';

//   const reader = new FileReader();

//   reader.onload = () => {
//     const arrayBuffer = reader.result as ArrayBuffer;
//     const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

//     loadingTask.promise.then((pdf) => {
//       const numPages = pdf.numPages;
//       const pagePromises = [];

//       for (let i = 1; i <= numPages; i++) {
//         pagePromises.push(
//           pdf.getPage(i).then((page) => page.getTextContent())
//         );
//       }

//       Promise.all(pagePromises).then((pages) => {
//         const fullText = pages
//           .map((pageContent: any) =>
//             pageContent.items.map((item: any) => item.str).join(' ')
//           )
//           .join('\n\n');

//         // ✅ Send for summarization
//         this.bookApi.summarizeBook(this.selectedFile!).subscribe({
//           next: (res) => {
//             this.isLoadingSumamry = false;
//             console.log('Summary result:', res);

//             // ✅ Store summary in service BEFORE navigation
//             this.fileUploadService.setSummary(res);

//             // ✅ Navigate without state (data is in service)
//             this.router.navigate(['/summary']);
//           },
//           error: (err) => {
//             this.error = 'Error summarizing the book.';
//             console.error(err);
//             this.isLoadingSumamry = false;
//           }
//         });
//       });
//     });
//   };

//   reader.readAsArrayBuffer(this.selectedFile);
// }
  async analyzeDocument(): Promise<void> {
    // Check if we have a URL input
    // const url = this.fileUploadService.getInputUrl();
    // if (url) {
    //   this.analyzeUrl();
    //   return;
    // }

    // Check if we have a file
    if (!this.selectedFile) {
      this.showNoFileWarning = true;
      return;
    }

    this.isLoadingAnalysis = true;
    this.error = '';
    this.analysisResult = null;

    const startTime = Date.now();

    this.bookApi.analyzeDocument(this.selectedFile).subscribe({
      next: (data: DocumentAnalysisResponse) => {
        this.analysisResult = data;
        // console.log("analysisResult:",this.analysisResult);

        this.processingTimeMs = Date.now() - startTime;
        console.log('Analysis complete in', this.processingTimeMs, 'ms');
        this.isLoadingAnalysis = false;
      },
      error: (error: any) => {
        this.isLoadingAnalysis = false;
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          this.error = 'Backend server is not running. Please start the server at http://127.0.0.1:8000';
        } else {
          this.error = 'Error analyzing the document.';
        }
        console.error('Analysis error:', error);
      }
    });
  }
  // getTheme(){
  //   this.isDarkMode= this.themeservice.getTheme() === 'dark' ? true : false;
  // }

  ngOnDestroy() {
  // Clear sessionStorage when component is destroyed
  sessionStorage.removeItem('summaryData');
  }

  // getFormattedTextPreview(text: string): string {
  //   if (!text) return '';
  //   // Split into lines
  //   const lines = text.split(/\r?\n/);
  //   // Find minimum indentation (spaces/tabs) for non-empty lines
  //   let minIndent: number | null = null;
  //   for (const line of lines) {
  //     if (line.trim() === '') continue;
  //     const match = line.match(/^(\s*)/);
  //     if (match) {
  //       const indent = match[1].length;
  //       if (minIndent === null || indent < minIndent) {
  //         minIndent = indent;
  //       }
  //     }
  //   }
  //   // Remove minIndent spaces/tabs from the start of each line
  //   if (minIndent && minIndent > 0) {
  //     return lines.map(line => line.startsWith(' '.repeat(minIndent)) || line.startsWith('\t'.repeat(minIndent)) ? line.slice(minIndent) : line).join('\n');
  //   }
  //   return text;

  // }

  getFileNameChunks(name: string, chunkSize: number): string[] {
    if (!name) return [];
    const chunks = [];
    for (let i = 0; i < name.length; i += chunkSize) {
      chunks.push(name.slice(i, i + chunkSize));
    }
    return chunks;
  }

  getFileExtension(filename: string): string {
    if (!filename) return '';
    const idx = filename.lastIndexOf('.');
    return idx !== -1 ? filename.substring(idx + 1).toLowerCase() : '';
  }

}
