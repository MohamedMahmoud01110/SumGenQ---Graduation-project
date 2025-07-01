import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FileUploadService } from '../../services/file-upload.service';
import { QuizService, QuizResponse, MCQ, TrueFalse, Essay, UserAnswers, GradeResponse } from '../../services/quiz.service';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

interface Question {
  id: number;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correctAnswer: number | string | boolean;
  explanation?: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css'
})
export class QuizComponent implements OnInit {
  // Quiz State
  quizStarted = false;
  quizCompleted = false;
  isLoading = false;
  showReviewModal = false;
  errorMessage = '';

  // File Upload Properties
  selectedFile: File | null = null;
  showNoFileWarning: boolean = false;
  showUnsupportedFileWarning = false;
  @ViewChild('fileInput') fileInput: any;

  // Quiz Settings
  difficulty = 'medium';

  // Quiz Progress
  currentQuestionIndex = 0;
  selectedAnswer: number | null = null;
  essayAnswer = '';
  showResult = false;
  timeLeft = 60;
  timerInterval: any;

  // Quiz Data from Backend
  quizResponse: QuizResponse | null = null;
  questions: Question[] = [];
  userAnswers: UserAnswers = {
    mcqs: [],
    true_false: [],
    essays: []
  };

  // Results
  correctAnswers = 0;
  scorePercentage = 0;
  timeSpent = '';
  gradeResponse: GradeResponse | null = null;

  constructor(
    public fileUploadService: FileUploadService,
    private quizService: QuizService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check backend health on component initialization
    this.checkBackendHealth();
  }

  // Backend Health Check
  checkBackendHealth(): void {
    this.quizService.checkQuizHealth().subscribe({
      next: (response) => {
        console.log('Quiz service health:', response);
      },
      error: (error) => {
        console.error('Quiz service health check failed:', error);
        this.errorMessage = 'Backend service is not available. Please try again later.';
      }
    });
  }

  // File Upload Methods
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
      // Validate file using service
      const validation = this.quizService.validateFile(file);
      if (!validation.isValid) {
        this.errorMessage = validation.error || 'Invalid file';
        this.showUnsupportedFileWarning = true;
        return;
      }

      // Set the file and store in service
      this.selectedFile = file;
      this.fileUploadService.setFile(file);

      // Clear any previous errors
      this.showUnsupportedFileWarning = false;
      this.errorMessage = '';

      console.log('File selected and stored:', file.name);
    }
  }

  private isSupportedFile(file: File): boolean {
    const validation = this.quizService.validateFile(file);
    return validation.isValid;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const box = event.currentTarget as HTMLElement;
    box.classList.remove('dragover');
    const file = event.dataTransfer?.files?.[0];
    if (file && this.isSupportedFile(file)) {
      this.selectedFile = file;
      this.fileUploadService.setFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const box = event.currentTarget as HTMLElement;
    box.classList.add('dragover');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const box = event.currentTarget as HTMLElement;
    box.classList.remove('dragover');
  }

  removeFile(): void {
    this.selectedFile = null;
    this.showUnsupportedFileWarning = false;
    this.errorMessage = '';
    this.fileUploadService.clearAll();
  }

  closeWarning(): void {
    this.showNoFileWarning = false;
    this.showUnsupportedFileWarning = false;
    this.errorMessage = '';
  }

  // Quiz Methods
  get currentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get progressPercentage(): number {
    return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  startQuiz(): void {
    if (!this.selectedFile) {
      this.showNoFileWarning = true;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Call backend to generate quiz
    this.quizService.generateQuiz(this.selectedFile, this.difficulty).subscribe({
      next: (response: QuizResponse) => {
        this.quizResponse = response;
        this.questions = this.convertQuizResponseToQuestions(response);
        this.initializeUserAnswers(response);
        this.isLoading = false;
        console.log('Quiz generated successfully:', response);

        // Show success message
        this.errorMessage = '';

        // Store in localStorage for quiz viewer
        localStorage.setItem('currentQuiz', JSON.stringify({
          quizResponse: response,
          questions: this.questions
        }));
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to generate quiz. Please try again.';
        console.error('Error generating quiz:', error);
      }
    });
  }

  // Convert backend response to component format
  private convertQuizResponseToQuestions(quizResponse: QuizResponse): Question[] {
    const questions: Question[] = [];
    let questionId = 1;

    // Convert MCQs
    quizResponse.mcqs.forEach((mcq, index) => {
      questions.push({
        id: questionId++,
        question: mcq.question,
        type: 'multiple_choice',
        options: mcq.options,
        correctAnswer: mcq.answer
      });
    });
    console.log('Converted MCQs:', quizResponse.mcqs);
    console.log('correct answers:', quizResponse.mcqs.map(q => q.answer));


    // Convert True/False
    quizResponse.true_false.forEach((tf, index) => {
      questions.push({
        id: questionId++,
        question: tf.question,
        type: 'true_false',
        correctAnswer: tf.answer
      });
    });

    // Convert Essays
    quizResponse.essays.forEach((essay, index) => {
      questions.push({
        id: questionId++,
        question: essay.question,
        type: 'essay',
        correctAnswer: essay.ideal_answer
      });
    });

    return questions;
  }

  // Initialize user answers arrays
  private initializeUserAnswers(quizResponse: QuizResponse): void {
    this.userAnswers = {
      mcqs: new Array(quizResponse.mcqs.length).fill(''),
      true_false: new Array(quizResponse.true_false.length).fill(null),
      essays: new Array(quizResponse.essays.length).fill('')
    };
  }

  selectAnswer(answerIndex: number): void {
    if (this.showResult) return;
    this.selectedAnswer = answerIndex;
  }

  submitAnswer(): void {
    if (this.selectedAnswer === null && this.essayAnswer.trim() === '') return;

    const currentQuestion = this.currentQuestion;
    if (!currentQuestion) return;

    // Save user answer based on question type
    if (currentQuestion.type === 'multiple_choice') {
      const mcqIndex = this.getMCQIndex(currentQuestion.id);
      if (mcqIndex !== -1 && this.selectedAnswer !== null) {
        this.userAnswers.mcqs[mcqIndex] = currentQuestion.options![this.selectedAnswer];
      }
    } else if (currentQuestion.type === 'true_false') {
      const tfIndex = this.getTrueFalseIndex(currentQuestion.id);
      if (tfIndex !== -1 && this.selectedAnswer !== null) {
        this.userAnswers.true_false[tfIndex] = this.selectedAnswer === 0; // 0 = True, 1 = False
      }
    } else if (currentQuestion.type === 'essay') {
      const essayIndex = this.getEssayIndex(currentQuestion.id);
      if (essayIndex !== -1) {
        this.userAnswers.essays[essayIndex] = this.essayAnswer;
      }
    }

    this.showResult = true;
    this.stopTimer();
  }

  // Helper methods to find question indices
  private getMCQIndex(questionId: number): number {
    if (!this.quizResponse) return -1;
    let mcqCount = 0;
    for (let i = 0; i < this.questions.length; i++) {
      if (this.questions[i].id === questionId) {
        return mcqCount;
      }
      if (this.questions[i].type === 'multiple_choice') {
        mcqCount++;
      }
    }
    return -1;
  }

  private getTrueFalseIndex(questionId: number): number {
    if (!this.quizResponse) return -1;
    let tfCount = 0;
    for (let i = 0; i < this.questions.length; i++) {
      if (this.questions[i].id === questionId) {
        return tfCount;
      }
      if (this.questions[i].type === 'true_false') {
        tfCount++;
      }
    }
    return -1;
  }

  private getEssayIndex(questionId: number): number {
    if (!this.quizResponse) return -1;
    let essayCount = 0;
    for (let i = 0; i < this.questions.length; i++) {
      if (this.questions[i].id === questionId) {
        return essayCount;
      }
      if (this.questions[i].type === 'essay') {
        essayCount++;
      }
    }
    return -1;
  }

  nextQuestion(): void {
    if (this.isLastQuestion) {
      this.finishQuiz();
    } else {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.essayAnswer = '';
      this.showResult = false;
      this.timeLeft = 60;
      this.startTimer();
    }
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.stopTimer();
        if (!this.showResult) {
          this.submitAnswer();
        }
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  finishQuiz(): void {
    this.quizCompleted = true;
    this.stopTimer();
    this.submitQuizToBackend();
  }

  submitQuizToBackend(): void {
    if (!this.quizResponse) return;

    this.isLoading = true;
    const gradeRequest = this.quizService.createGradeRequest(this.userAnswers, this.quizResponse);

    this.quizService.submitAnswers(gradeRequest).subscribe({
      next: (response: GradeResponse) => {
        this.gradeResponse = response;
        this.scorePercentage = response.final_score;
        this.calculateResults();
        this.isLoading = false;
        console.log('Quiz graded successfully:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to grade quiz. Please try again.';
        console.error('Error grading quiz:', error);
        // Fallback to local calculation
        this.calculateResults();
      }
    });
  }

  calculateResults(): void {
    if (this.gradeResponse) {
      this.scorePercentage = this.gradeResponse.final_score;
    } else {
      // Fallback calculation for objective questions only
      this.scorePercentage = this.calculateObjectiveScore();
    }
    this.timeSpent = this.formatTime(60 - this.timeLeft);
  }

  private calculateObjectiveScore(): number {
    let totalObjective = 0;
    let correctObjective = 0;

    // Calculate MCQ score
    if (this.quizResponse) {
      this.quizResponse.mcqs.forEach((mcq, index) => {
        totalObjective++;
        if (this.userAnswers.mcqs[index] === mcq.answer) {
          correctObjective++;
        }
      });

      // Calculate True/False score
      this.quizResponse.true_false.forEach((tf, index) => {
        totalObjective++;
        if (this.userAnswers.true_false[index] === tf.answer) {
          correctObjective++;
        }
      });
    }

    return totalObjective > 0 ? (correctObjective / totalObjective) * 100 : 0;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  retryQuiz(): void {
    this.resetQuiz();
    this.quizStarted = true;
    this.startTimer();
  }

  newQuiz(): void {
    this.resetQuiz();
  }

  resetQuiz(): void {
    this.quizStarted = false;
    this.quizCompleted = false;
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.essayAnswer = '';
    this.showResult = false;
    this.timeLeft = 60;
    this.questions = [];
    this.userAnswers = { mcqs: [], true_false: [], essays: [] };
    this.quizResponse = null;
    this.gradeResponse = null;
    this.correctAnswers = 0;
    this.scorePercentage = 0;
    this.timeSpent = '';
    this.errorMessage = '';
    this.stopTimer();
  }

  reviewAnswers(): void {
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
  }

  getAnswerText(question: Question, answerIndex: number | string | boolean): string {
    if (question.type === 'true_false') {
      return answerIndex === true ? 'True' : 'False';
    }
    if (question.type === 'multiple_choice') {
      return question.options?.[answerIndex as number] || 'Unknown';
    }
    return answerIndex as string;
  }

  getUserAnswerText(question: Question, questionIndex: number): string {
    if (question.type === 'multiple_choice') {
      const mcqIndex = this.getMCQIndex(question.id);
      return mcqIndex !== -1 ? this.userAnswers.mcqs[mcqIndex] || 'Not answered' : 'Not answered';
    } else if (question.type === 'true_false') {
      const tfIndex = this.getTrueFalseIndex(question.id);
      return tfIndex !== -1 ? (this.userAnswers.true_false[tfIndex] ? 'True' : 'False') : 'Not answered';
    } else if (question.type === 'essay') {
      const essayIndex = this.getEssayIndex(question.id);
      return essayIndex !== -1 ? this.userAnswers.essays[essayIndex] || 'Not answered' : 'Not answered';
    }
    return 'Not answered';
  }

  isAnswerCorrect(question: Question, questionIndex: number): boolean {
    if (question.type === 'multiple_choice') {
      const mcqIndex = this.getMCQIndex(question.id);
      return mcqIndex !== -1 && this.userAnswers.mcqs[mcqIndex] === question.correctAnswer;
    } else if (question.type === 'true_false') {
      const tfIndex = this.getTrueFalseIndex(question.id);
      return tfIndex !== -1 && this.userAnswers.true_false[tfIndex] === question.correctAnswer;
    } else if (question.type === 'essay') {
      // For essays, we consider it correct if there's any answer (grading is done by backend)
      const essayIndex = this.getEssayIndex(question.id);
      return essayIndex !== -1 && this.userAnswers.essays[essayIndex].trim() !== '';
    }
    return false;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  async downloadQuiz(): Promise<void> {
    if (!this.selectedFile || !this.quizResponse) {
      this.showNoFileWarning = true;
      return;
    }

    this.isLoading = true;

    try {
      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: "Quiz Generated from Document",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
                before: 400
              }
            }),

            // Document Info
            new Paragraph({
              children: [
                new TextRun({
                  text: "Source Document: ",
                  bold: true
                }),
                new TextRun({
                  text: this.selectedFile.name
                })
              ],
              spacing: {
                after: 200
              }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Difficulty Level: ",
                  bold: true
                }),
                new TextRun({
                  text: this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)
                })
              ],
              spacing: {
                after: 200
              }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Generated on: ",
                  bold: true
                }),
                new TextRun({
                  text: new Date().toLocaleDateString() + " at " + new Date().toLocaleTimeString()
                })
              ],
              spacing: {
                after: 400
              }
            }),

            // Questions
            ...this.questions.map((question, index) => {
              const questionElements = [
                // Question number and text
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Question ${index + 1}: `,
                      bold: true,
                      size: 24
                    }),
                    new TextRun({
                      text: question.question,
                      size: 24
                    })
                  ],
                  spacing: {
                    after: 200,
                    before: 300
                  }
                })
              ];

              // Add options for multiple choice questions
              if (question.type === 'multiple_choice' && question.options) {
                question.options.forEach((option, optionIndex) => {
                  const optionLetter = String.fromCharCode(65 + optionIndex);
                  questionElements.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${optionLetter}. `,
                          bold: true
                        }),
                        new TextRun({
                          text: option
                        })
                      ],
                      spacing: {
                        after: 100
                      }
                    })
                  );
                });
              } else if (question.type === 'true_false') {
                questionElements.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "A. True",
                        bold: true
                      })
                    ],
                    spacing: {
                      after: 100
                    }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "B. False",
                        bold: true
                      })
                    ],
                    spacing: {
                      after: 100
                    }
                  })
                );
              }

              // Add correct answer
              questionElements.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Correct Answer: ",
                      bold: true,
                      color: "008000"
                    }),
                    new TextRun({
                      text: this.getAnswerText(question, question.correctAnswer),
                      color: "008000"
                    })
                  ],
                  spacing: {
                    after: 200
                  }
                })
              );

              return questionElements;
            }).flat()
          ]
        }]
      });

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quiz_${this.selectedFile.name.replace(/\.[^/.]+$/, '')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Quiz downloaded as Word document');
    } catch (error) {
      console.error('Error creating Word document:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Navigate back to quiz generation
  goBackToQuiz(): void {
    this.router.navigate(['/quiz']);
  }

  // Navigate to quiz viewer
  navigateToQuizViewer(): void {
    if (this.quizResponse && this.questions.length > 0) {
      this.router.navigate(['/quiz-viewer'], {
        state: {
          quizResponse: this.quizResponse,
          questions: this.questions
        }
      });
    }
  }
}
