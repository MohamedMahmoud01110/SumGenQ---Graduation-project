import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService, QuizResponse, UserAnswers, GradeResponse } from '../../services/quiz.service';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { HistoryService } from '../../services/history.service';

interface Question {
  id: number;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  feedback: string;
  // level:string;
  correctAnswer: number | string | boolean;
  explanation?: string;
}

@Component({
  selector: 'app-quiz-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-viewer.component.html',
  styleUrl: './quiz-viewer.component.css'
})
export class QuizViewerComponent implements OnInit {
  // Quiz Data
  quizResponse: QuizResponse | null = null;
  questions: Question[] = [];
  userAnswers: UserAnswers = {
    mcqs: [],
    true_false: [],
    essays: []
  };

  // Add difficulty property
  difficulty: string = '';

  // UI State
  isLoading = false;
  showResultsModal = false;
  showIncompleteAnswersWarning = false;

  errorMessage = '';

  // Results
  gradeResponse: GradeResponse | null = null;
  scorePercentage = 0;
  timeSpent = '';

  private quizSaved = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private historyService: HistoryService
  ) {}

    ngOnInit(): void {
    // Get quiz data from route state or localStorage
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.quizResponse = navigation.extras.state['quizResponse'];
      this.questions = navigation.extras.state['questions'];
      this.difficulty = navigation.extras.state['difficulty'] || '';
      console.log("difficulty is: ",this.difficulty);

      this.initializeUserAnswers();
    } else {
      // Try to get from localStorage as fallback
      this.loadQuizFromStorage();
    }
  }

  private loadQuizFromStorage(): void {
    try {
      const storedQuiz = localStorage.getItem('currentQuiz');
      if (storedQuiz) {
        const quizData = JSON.parse(storedQuiz);
        this.quizResponse = quizData.quizResponse;
        this.questions = quizData.questions;
        this.difficulty = quizData.difficulty || 'medium'; // Load difficulty from localStorage
        this.initializeUserAnswers();
      } else {
        this.router.navigate(['/not-found']);
      }
    } catch (error) {
      this.router.navigate(['/not-found']);
    }
  }

  private initializeUserAnswers(): void {
    if (this.quizResponse) {
      this.userAnswers = {
        mcqs: new Array(this.quizResponse.mcqs.length).fill(''),
        true_false: new Array(this.quizResponse.true_false.length).fill(null),
        essays: new Array(this.quizResponse.essays.length).fill('')
      };
    }
  }

  // Answer handling methods
  selectMCQAnswer(questionId: number, answer: string, optionIndex: number): void {
    const mcqIndex = this.getMCQIndex(questionId);
    if (mcqIndex !== -1) {
      this.userAnswers.mcqs[mcqIndex] = this.getOptionLetter(optionIndex);
    }
  }

  selectTrueFalseAnswer(questionId: number, answer: boolean): void {
    const tfIndex = this.getTrueFalseIndex(questionId);
    if (tfIndex !== -1) {
      this.userAnswers.true_false[tfIndex] = answer;
    }
  }

  updateEssayAnswer(questionId: number, answer: string): void {
    const essayIndex = this.getEssayIndex(questionId);
    if (essayIndex !== -1) {
      this.userAnswers.essays[essayIndex] = answer;
    }
  }
  closeIncompleteWarning(): void {
  this.showIncompleteAnswersWarning = false;
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

  // Get user answers for display
  getMCQUserAnswer(questionId: number): string {
    const mcqIndex = this.getMCQIndex(questionId);
    return mcqIndex !== -1 ? this.userAnswers.mcqs[mcqIndex] || '' : '';
  }

  getTrueFalseUserAnswer(questionId: number): boolean | null {
    const tfIndex = this.getTrueFalseIndex(questionId);
    return tfIndex !== -1 ? this.userAnswers.true_false[tfIndex] : null;
  }

  getEssayUserAnswer(questionId: number): string {
    const essayIndex = this.getEssayIndex(questionId);
    return essayIndex !== -1 ? this.userAnswers.essays[essayIndex] || '' : '';
  }

  getMCQUserAnswerText(question: Question): string {
    const userLetter = this.getMCQUserAnswer(question.id);
    if (!userLetter || !question.options) return 'Not answered';
    const idx = userLetter.charCodeAt(0) - 65;
    // Remove leading letter/period/space from the answer text if present
    const answerText = question.options[idx].replace(/^([A-D]\.|[A-D])\s*/, '');
    return `${userLetter}. ${answerText}`;
  }

  getMCQCorrectAnswerText(question: Question): string {
    if (!question.correctAnswer || !question.options) return '';
    let idx: number;
    let letter: string;
    if (typeof question.correctAnswer === 'string') {
      letter = question.correctAnswer.toUpperCase();
      idx = letter.charCodeAt(0) - 65;
    } else if (typeof question.correctAnswer === 'number') {
      idx = question.correctAnswer;
      letter = String.fromCharCode(65 + idx);
    } else {
      return '';
    }
    // Debug log
   //console.log('MCQ CorrectAnswer:', question.correctAnswer, 'Letter:', letter, 'Index:', idx, 'Options:', question.options);
    if (idx < 0 || idx >= question.options.length || !question.options[idx]) return '';
    const answerText = question.options[idx].replace(/^([A-D]\.|[A-D])\s*/, '');
    return `${letter}. ${answerText}`;
  }

  isMCQCorrect(question: Question): boolean {
    return this.getMCQUserAnswer(question.id) === question.correctAnswer;
  }

  isTrueFalseCorrect(question: Question): boolean {
    const userAnswer = this.getTrueFalseUserAnswer(question.id);
    return userAnswer === question.correctAnswer;
  }


  // Submit quiz
  submitQuiz(): void {
  if (!this.quizResponse) return;

  if (!this.isQuizComplete()) {
    this.showIncompleteAnswersWarning = true; // Show the modal
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  const gradeRequest = this.quizService.createGradeRequest(this.userAnswers, this.quizResponse);

  this.quizService.submitAnswers(gradeRequest).subscribe({
    next: (response: GradeResponse) => {
      this.gradeResponse = response;
      this.scorePercentage = response.final_score;

      // Update questions with feedback from grading response
      this.updateQuestionsWithFeedback(response);

      this.showResultsModal = true;
      this.isLoading = false;
      console.log('Quiz graded successfully:', response);
    },
    error: (error) => {
      this.isLoading = false;
      this.errorMessage = error.message || 'Failed to grade quiz. Please try again.';
      console.error('Error grading quiz:', error);
      this.calculateLocalScore();
      this.showResultsModal = true;
    }
  });
  }

  private updateQuestionsWithFeedback(gradeResponse: GradeResponse): void {
    if (!gradeResponse.essay_feedback || gradeResponse.essay_feedback.length === 0) {
      return;
    }

    // Find essay questions and update them with feedback
    let essayIndex = 0;
    this.questions.forEach(question => {
      if (question.type === 'essay' && essayIndex < gradeResponse.essay_feedback.length) {
        question.feedback = gradeResponse.essay_feedback[essayIndex];
        essayIndex++;
      }
    });
  }




  private calculateLocalScore(): void {
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

    this.scorePercentage = totalObjective > 0 ? (correctObjective / totalObjective) * 100 : 0;
  }

  // Save quiz to backend and print in console
  private saveQuizToHistory(): void {
    if (this.quizSaved) {
      console.log('Quiz already saved to backend.');
      return;
    }
    if (!this.quizResponse || !this.questions || this.questions.length === 0) {
      console.warn('No quiz data to save.');
      return;
    }
    // Map questions to QuizQuestion[]
    const quizQuestions = this.questions.map((q) => {
      let userAnswer = '';
      let rightAnswer = '';
      if (q.type === 'multiple_choice') {
        const mcqIndex = this.getMCQIndex(q.id);
        let userLetter = mcqIndex !== -1 && this.userAnswers.mcqs && this.userAnswers.mcqs[mcqIndex] ? this.userAnswers.mcqs[mcqIndex] : '';
        let userText = '';
        let rightLetter = '';
        let rightText = '';
        if (typeof q.correctAnswer === 'number') {
          rightLetter = String.fromCharCode(65 + q.correctAnswer);
        } else if (typeof q.correctAnswer === 'string') {
          rightLetter = q.correctAnswer.toUpperCase();
        }
        if (typeof q.correctAnswer === 'number' && q.options && q.options[q.correctAnswer]) {
          rightText = q.options[q.correctAnswer];
        }
        if (userLetter && q.options) {
          const userIdx = userLetter.charCodeAt(0) - 65;
          userText = q.options[userIdx] || '';
        }
        userAnswer = userLetter && userText ? `${userLetter} (${userText})` : (userLetter || '');
        rightAnswer = rightLetter && rightText ? `${rightLetter} (${rightText})` : (rightLetter || '');
      } else if (q.type === 'true_false') {
        const tfIndex = this.getTrueFalseIndex(q.id);
        let userVal = tfIndex !== -1 && this.userAnswers.true_false && typeof this.userAnswers.true_false[tfIndex] !== 'undefined' && this.userAnswers.true_false[tfIndex] !== null
          ? String(this.userAnswers.true_false[tfIndex])
          : '';
        let rightVal = typeof q.correctAnswer !== 'undefined' && q.correctAnswer !== null ? String(q.correctAnswer) : '';
        userAnswer = userVal ? `${userVal} (${userVal === 'true' ? 'True' : userVal === 'false' ? 'False' : ''})` : '';
        rightAnswer = rightVal ? `${rightVal} (${rightVal === 'true' ? 'True' : rightVal === 'false' ? 'False' : ''})` : '';
      } else if (q.type === 'essay') {
        const essayIndex = this.getEssayIndex(q.id);
        let userText = essayIndex !== -1 && this.userAnswers.essays && this.userAnswers.essays[essayIndex] ? this.userAnswers.essays[essayIndex] : '';
        let rightText = typeof q.correctAnswer === 'string' ? q.correctAnswer : '';
        userAnswer = userText || '';
        rightAnswer = rightText || '';
      }
      return {
        question: q.question || '',
        userAnswer: userAnswer || '',
        rightAnswer: rightAnswer || '',
        feedback:q.feedback || "No FeedBack",
      };
    });
    const score = Math.round(this.scorePercentage);

    // Collect feedback from questions
    const feedback = this.questions.map(q => q.feedback).filter(f => f && f.trim() !== '');


    const quizData = {
      Score: score,
      Level:this.difficulty,
      Questions: quizQuestions,
    };
    console.log('Quiz payload:', quizData);
    this.historyService.addQuiz(quizData).subscribe({
      next: (res) => {
        this.quizSaved = true;
        console.log('Quiz data sent to backend successfully:', res);
        console.log("the data are: ", quizData);

      },
      error: (err) => {
        console.error('Failed to send quiz data to backend:', err);
      }
    });
  }

  // Close results modal
  closeResultsModal(): void {
    this.saveQuizToHistory();
    this.showResultsModal = false;
    this.gradeResponse = null;
    this.scorePercentage = 0;
    this.quizResponse = null;
    this.questions = [];
    this.userAnswers = { mcqs: [], true_false: [], essays: [] };
    localStorage.removeItem('currentQuiz');
    this.goBackToQuiz();
  }

  // Navigate back to quiz generation
  goBackToQuiz(): void {
    this.showResultsModal = false;
    this.gradeResponse = null;
    this.scorePercentage = 0;
    this.quizResponse = null;
    this.questions = [];
    this.userAnswers = { mcqs: [], true_false: [], essays: [] };
    // Clear stored quiz data
    localStorage.removeItem('currentQuiz');
    this.router.navigate(['/quiz']);
  }

  // Download quiz as Word document
  async downloadQuiz(): Promise<void> {
    if (!this.questions.length) {
      this.errorMessage = 'No quiz data available for download.';
      return;
    }

    try {
      this.isLoading = true;

      // Print questions and correct answers to the console
      this.questions.forEach((question, idx) => {
        let correctAnswerText = 'Unknown';
        if (question.type === 'multiple_choice' && question.options && question.correctAnswer !== undefined && question.correctAnswer !== null) {
          let answerIdx: number | null = null;
          let letter: string = '';
          if (typeof question.correctAnswer === 'number') {
            answerIdx = question.correctAnswer;
            letter = String.fromCharCode(65 + answerIdx);
          } else if (typeof question.correctAnswer === 'string') {
            answerIdx = question.correctAnswer.charCodeAt(0) - 65;
            letter = question.correctAnswer;
          }
          if (answerIdx !== null && question.options[answerIdx]) {
            const answerText = question.options[answerIdx].replace(/^([A-D]\.|[A-D])\s*/, '');
            correctAnswerText = `${letter}. ${answerText}`;
          }
        } else if (question.type === 'true_false') {
          correctAnswerText = question.correctAnswer === true ? 'True' : 'False';
        } else if (question.type === 'essay') {
          correctAnswerText = question.correctAnswer as string;
        }
        // console.log(`Q${idx + 1}: ${question.question}\nCorrect Answer: ${correctAnswerText}`);
      });

      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: "Quiz Questions and Answers",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
                before: 400
              }
            }),

            // Quiz Information
            new Paragraph({
              children: [
                new TextRun({
                  text: "Generated Quiz",
                  bold: true,
                  size: 24
                })
              ],
              spacing: {
                after: 200
              }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Total Questions: ${this.questions.length}`,
                  size: 20
                })
              ],
              spacing: {
                after: 200
              }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
                  size: 16,
                  color: "666666"
                })
              ],
              spacing: {
                after: 400
              }
            }),

            // Questions Section
            new Paragraph({
              text: "Questions and Answers",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                after: 300,
                before: 300
              }
            }),

            // Generate questions content
            ...this.generateQuestionsContent()
          ]
        }]
      });

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quiz-questions-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.isLoading = false;
      console.log('Quiz downloaded successfully');
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'Failed to download quiz. Please try again.';
      console.error('Error downloading quiz:', error);
    }
  }

  private generateQuestionsContent(): Paragraph[] {
    const content: Paragraph[] = [];
    this.questions.forEach((question, idx) => {
      // Question
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Question ${idx + 1}: ${question.question}`,
              bold: true,
              size: 24
            })
          ],
          spacing: { after: 200 }
        })
      );

      // Options (for MCQ)
      if (question.type === 'multiple_choice' && question.options) {
        question.options.forEach((option, i) => {
          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${this.getOptionLetter(i)}. `,
                  bold: true,
                  size: 16
                }),
                new TextRun({
                  text: option,
                  size: 16
                })
              ],
              spacing: { after: 100 }
            })
          );
        });
      }

      // True/False options
      if (question.type === 'true_false') {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'A. True', size: 16 })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'B. False', size: 16 })
            ],
            spacing: { after: 100 }
          })
        );
      }

      // Essay placeholder
      if (question.type === 'essay') {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Answer: ', bold: true, size: 16 }),
              new TextRun({ text: '_________________________________________________', size: 16, color: 'CCCCCC' })
            ],
            spacing: { after: 200 }
          })
        );
      }

      // Correct Answer
      let correctAnswerText = 'Unknown';
      if (question.type === 'multiple_choice' && question.options && question.correctAnswer !== undefined && question.correctAnswer !== null) {
        let idx: number | null = null;
        let letter: string = '';
        if (typeof question.correctAnswer === 'number') {
          idx = question.correctAnswer;
          letter = String.fromCharCode(65 + idx);
        } else if (typeof question.correctAnswer === 'string') {
          idx = question.correctAnswer.charCodeAt(0) - 65;
          letter = question.correctAnswer;
        }
        if (idx !== null && question.options[idx]) {
          const answerText = question.options[idx].replace(/^([A-D]\.|[A-D])\s*/, '');
          correctAnswerText = `${letter}. ${answerText}`;
        }
      } else if (question.type === 'true_false') {
        correctAnswerText = question.correctAnswer === true ? 'True' : 'False';
      } else if (question.type === 'essay') {
        correctAnswerText = question.correctAnswer as string;
      }
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Correct Answer: ',
              bold: true,
              size: 16,
              color: '28A745'
            }),
            new TextRun({
              text: correctAnswerText,
              size: 16,
              color: '28A745'
            })
          ],
          spacing: { after: 200 }
        })
      );

      // User Answer (if available)
      const userAnswer = this.getUserAnswerText(question);
      if (userAnswer) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Your Answer: ',
                bold: true,
                size: 16,
                color: '007BFF'
              }),
              new TextRun({
                text: userAnswer,
                size: 16,
                color: '007BFF'
              })
            ],
            spacing: { after: 200 }
          })
        );
      }

      // Separator
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '_________________________________________________________________',
              color: 'CCCCCC'
            })
          ],
          spacing: { after: 300 }
        })
      );
    });

    return content;
  }

  private getQuestionTypeName(type: string): string {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True/False';
      case 'essay':
        return 'Essay';
      default:
        return type;
    }
  }

  private getUserAnswerText(question: Question): string {
    if (question.type === 'multiple_choice') {
      return this.getMCQUserAnswerText(question);
    } else if (question.type === 'true_false') {
      const answer = this.getTrueFalseUserAnswer(question.id);
      if (answer === null) return 'Not answered';
      return answer ? 'True' : 'False';
    } else if (question.type === 'essay') {
      return this.getEssayUserAnswer(question.id) || 'Not answered';
    }
    return 'Not answered';
  }

  // Utility methods
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  getAnswerText(question: Question, answerIndex: number | string | boolean): string {
    if (question.type === 'true_false') {
      return answerIndex === true ? 'True' : 'False';
    }
    if (question.type === 'multiple_choice') {
      if (question.options && typeof answerIndex === 'number') {
        return question.options[answerIndex];
      }
      return 'Unknown';
    }
    return answerIndex as string;
  }

  // Check if all questions are answered
  isQuizComplete(): boolean {
    if (!this.quizResponse) return false;
    const mcqAnswered = this.userAnswers.mcqs.every(answer => answer !== '');
    const tfAnswered = this.userAnswers.true_false.every(answer => answer !== null);
    const essayAnswered = this.userAnswers.essays.every(answer => answer.trim() !== '');
    return mcqAnswered && tfAnswered && essayAnswered;
  }

  // Get completion percentage
  getCompletionPercentage(): number {
    if (!this.quizResponse) return 0;
    const totalQuestions = this.quizResponse.mcqs.length + this.quizResponse.true_false.length + this.quizResponse.essays.length;
    let answeredQuestions = 0;
    answeredQuestions += this.userAnswers.mcqs.filter(answer => answer !== '').length;
    answeredQuestions += this.userAnswers.true_false.filter(answer => answer !== null).length;
    answeredQuestions += this.userAnswers.essays.filter(answer => answer.trim() !== '').length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }

  ngOnDestroy(): void {
    this.quizResponse = null;
    this.questions = [];
    this.userAnswers = {
      mcqs: [],
      true_false: [],
      essays: []
    };
    this.goBackToQuiz();
  }
}
