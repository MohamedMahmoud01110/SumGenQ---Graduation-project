import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { HistoryService, TextSummary, BookSummary, Quiz, QuizQuestion } from '../../services/history.service';
import { AuthService } from '../../auth/services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit, OnDestroy {
  textSummaries: TextSummary[] = [];
  bookSummaries: BookSummary[] = [];
  loading = false;
  theme : string = '';
  error = '';
  activeTab: 'text' | 'book' | 'quiz' = 'text';
  searchTerm = '';
  filteredTextSummaries: TextSummary[] = [];
  filteredBookSummaries: BookSummary[] = [];
  expandedItems = new Set<number>();
  deletingItems = new Set<number>();
  showDeleteConfirm = false;
  deleteConfirmType: 'individual' | 'all' = 'individual';
  itemToDelete: number | null = null;
  copiedSummaryIds = new Set<number>();
  showMoreModal = false;
  modalSummary: any = null;
  modalType: 'text' | 'book' | null = null;
  selectedSummary: any = null;
  showModal: boolean = false;
  private subscriptions = new Subscription();
  showTextExpandModal = false;
  expandedTextSummary: TextSummary | null = null;
  showBookExpandModal = false;
  expandedBookSummary: BookSummary | null = null;
  copiedExpandTextSummary: 'summary' | 'text' | null = null;
  copiedExpandBookSummary: 'summary' | 'text' | null = null;
  // --- Chat State ---
  chatMessagesMap: { [summaryId: number]: any[] } = {};
  currentQuestionMap: { [summaryId: number]: string } = {};
  isLoadingChatMap: { [summaryId: number]: boolean } = {};
  showChatModal: boolean = false;
  chatModalSummary: TextSummary | BookSummary | null = null;
  chatModalType: 'text' | 'book' | null = null;
  showEmptyTextWarning: boolean = false;
  quizzes: Quiz[] = [];
  filteredQuizzes: Quiz[] = [];
  showQuizExpandModal = false;
  expandedQuiz: any = null;


  constructor(
    private historyService: HistoryService,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadSummaries();
    this.theme = this.themeService.getTheme();
    this.subscriptions.add(
      this.themeService.theme$.subscribe((theme) => {
        this.theme = theme;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadSummaries(): void {
    this.loading = true;
    this.error = '';

    // Load text summaries
    const textSub = this.historyService.getTextSummaries().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.textSummaries = response.data as TextSummary[];
          this.filteredTextSummaries = [...this.textSummaries];
        } else {
          this.error = response.message || 'Failed to load text summaries';
        }
      },
      error: (err) => {
        this.error = 'Failed to load text summaries';
        console.error('Error loading text summaries:', err);
      }
    });

    // Load book summaries
    const bookSub = this.historyService.getBookSummaries().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.bookSummaries = response.data as BookSummary[];
          this.filteredBookSummaries = [...this.bookSummaries];
        } else {
          this.error = response.message || 'Failed to load book summaries';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load book summaries';
        console.error('Error loading book summaries:', err);
        this.loading = false;
      }
    });

    // Load quizzes
    const quizSub = this.historyService.getUserQuizzes().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.quizzes = response.quizzes || [];
          this.filteredQuizzes = [...this.quizzes];
          console.log('Loaded quizzes:', this.quizzes);
        } else {
          this.error = 'Failed to load quizzes';
        }
      },
      error: (err) => {
        this.error = 'Failed to load quizzes';
        console.error('Error loading quizzes:', err);
      }
    });

    this.subscriptions.add(textSub);
    this.subscriptions.add(bookSub);
    this.subscriptions.add(quizSub);
  }

  setActiveTab(tab: 'text' | 'book' | 'quiz'): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.applySearch();
  }

  applySearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredTextSummaries = [...this.textSummaries];
      this.filteredBookSummaries = [...this.bookSummaries];
      this.filteredQuizzes = [...this.quizzes];
      return;
    }

    const term = this.searchTerm.toLowerCase();

    this.filteredTextSummaries = this.textSummaries.filter(summary =>
      summary.Text.toLowerCase().includes(term) ||
      summary.Summary.toLowerCase().includes(term) ||
      summary.Topic?.toLowerCase().includes(term)
    );

    this.filteredBookSummaries = this.bookSummaries.filter(summary =>
      summary.Book.toLowerCase().includes(term) ||
      summary.Summary.toLowerCase().includes(term) ||
      summary.Topic?.toLowerCase().includes(term)
    );

    this.filteredQuizzes = this.quizzes.filter(quiz =>
      quiz.questions.some(q =>
        q.question.toLowerCase().includes(term) ||
        q.userAnswer.toLowerCase().includes(term) ||
        q.rightAnswer.toLowerCase().includes(term)
      )
    );
  }

  toggleExpanded(id: number): void {
    if (this.expandedItems.has(id)) {
      this.expandedItems.delete(id);
    } else {
      this.expandedItems.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedItems.has(id);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  truncateText(text: string, maxLength: number = 150): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  copyToClipboard(text: string, id?: number): void {
    navigator.clipboard.writeText(text).then(() => {
      if (id !== undefined) {
        this.copiedSummaryIds.add(id);
        setTimeout(() => {
          this.copiedSummaryIds.delete(id);
        }, 1000);
      }
      // You could add a toast notification here
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  copyExpandTextModal(field: 'summary' | 'text') {
    if (!this.expandedTextSummary) return;
    const value = field === 'summary' ? this.expandedTextSummary.Summary : this.expandedTextSummary.Text;
    navigator.clipboard.writeText(value).then(() => {
      this.copiedExpandTextSummary = field;
      setTimeout(() => {
        this.copiedExpandTextSummary = null;
      }, 1000);
    });
  }

  copyExpandBookModal(field: 'summary' | 'text') {
    if (!this.expandedBookSummary) return;
    const value = field === 'summary' ? this.expandedBookSummary.Summary : this.expandedBookSummary.Book;
    navigator.clipboard.writeText(value).then(() => {
      this.copiedExpandBookSummary = field;
      setTimeout(() => {
        this.copiedExpandBookSummary = null;
      }, 1000);
    });
  }

  closeWarning(): void {
    this.showDeleteConfirm = false;
    this.loading = false;
    this.error = '';
  }

  getSummaryCount(): number {
    if (this.activeTab === 'text') return this.filteredTextSummaries.length;
    if (this.activeTab === 'book') return this.filteredBookSummaries.length;
    if (this.activeTab === 'quiz') return this.filteredQuizzes.length;
    return 0;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearch();
  }

  // Delete functionality
  confirmDelete(id: number, type: 'individual' = 'individual'): void {
    this.deleteConfirmType = type;
    this.itemToDelete = id;
    this.showDeleteConfirm = true;
  }

  confirmDeleteAll(): void {
    this.deleteConfirmType = 'all';
    this.itemToDelete = null;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.itemToDelete = null;
  }

  deleteItem(): void {
    if (!this.itemToDelete && this.deleteConfirmType === 'individual') {
      return;
    }

    this.showDeleteConfirm = false;
    const id = this.itemToDelete;

    if (this.deleteConfirmType === 'individual' && id) {
      this.deleteIndividualSummary(id);
    } else if (this.deleteConfirmType === 'all') {
      this.deleteAllSummaries();
    }

    this.itemToDelete = null;
  }

  private deleteIndividualSummary(id: number): void {
    this.deletingItems.add(id);
    let deleteObs;
    if (this.activeTab === 'text') {
      deleteObs = this.historyService.deleteTextSummary(id);
    } else if (this.activeTab === 'book') {
      deleteObs = this.historyService.deleteBookSummary(id);
    } else {
      deleteObs = this.historyService.deleteQuiz(id);
    }
    const deleteSub = deleteObs.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          if (this.activeTab === 'text') {
            this.textSummaries = this.textSummaries.filter(item => item.id !== id);
            this.filteredTextSummaries = this.filteredTextSummaries.filter(item => item.id !== id);
          } else if (this.activeTab === 'book') {
            this.bookSummaries = this.bookSummaries.filter(item => item.id !== id);
            this.filteredBookSummaries = this.filteredBookSummaries.filter(item => item.id !== id);
          } else {
            this.quizzes = this.quizzes.filter(item => item.id !== id);
            this.filteredQuizzes = this.filteredQuizzes.filter(item => item.id !== id);
          }
        } else {
          this.error = response.message || 'Failed to delete summary';
        }
        this.deletingItems.delete(id);
      },
      error: (err) => {
        this.error = 'Failed to delete summary';
        console.error('Error deleting summary:', err);
        this.deletingItems.delete(id);
      }
    });
    this.subscriptions.add(deleteSub);
  }

  private deleteAllSummaries(): void {
    let deleteObs;
    if (this.activeTab === 'text') {
      deleteObs = this.historyService.deleteAllTextSummaries();
    } else if (this.activeTab === 'book') {
      deleteObs = this.historyService.deleteAllBookSummaries();
    } else {
      // No delete all quizzes endpoint, so just clear arrays
      this.quizzes = [];
      this.filteredQuizzes = [];
      return;
    }
    const deleteSub = deleteObs.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          if (this.activeTab === 'text') {
            this.textSummaries = [];
            this.filteredTextSummaries = [];
          } else if (this.activeTab === 'book') {
            this.bookSummaries = [];
            this.filteredBookSummaries = [];
          }
        } else {
          this.error = response.message || 'Failed to delete all summaries';
        }
      },
      error: (err) => {
        this.error = 'Failed to delete all summaries';
        console.error('Error deleting all summaries:', err);
      }
    });
    this.subscriptions.add(deleteSub);
  }

  isDeleting(id: number): boolean {
    return this.deletingItems.has(id);
  }

  getDeleteConfirmMessage(): string {
    if (this.deleteConfirmType === 'individual' && this.itemToDelete) {
      return `Are you sure you want to delete summary #${this.itemToDelete}?`;
    } else if (this.deleteConfirmType === 'all') {
      const count = this.activeTab === 'text' ? this.textSummaries.length : this.activeTab === 'book' ? this.bookSummaries.length : this.quizzes.length;
      return `Are you sure you want to delete all ${count} ${this.activeTab} summaries? This action cannot be undone.`;
    }
    return '';
  }

  openModal(summary: any, type: 'text' | 'book') {
    this.modalSummary = summary;
    this.modalType = type;
    this.showMoreModal = true;
  }

  closeMoreModal() {
    this.showMoreModal = false;
    this.modalSummary = null;
    this.modalType = null;
  }

  openTextExpandModal(summary: TextSummary) {
    this.expandedTextSummary = summary;
    this.showTextExpandModal = true;
  }

  closeTextExpandModal() {
    this.showTextExpandModal = false;
    this.expandedTextSummary = null;
  }

  openBookExpandModal(summary: BookSummary) {
    this.expandedBookSummary = summary;
    this.showBookExpandModal = true;
  }

  closeBookExpandModal() {
    this.showBookExpandModal = false;
    this.expandedBookSummary = null;
  }

  // --- Chat Methods ---
  openChatModal(summary: TextSummary | BookSummary, type: 'text' | 'book') {
    this.chatModalSummary = summary;
    this.chatModalType = type;
    this.showChatModal = true;
    if (type === 'book') {
      this.isLoadingChatMap[summary.id] = true;
      this.historyService.getAllChat(summary.id).subscribe({
        next: (response) => {
          console.log('Chat history response:', response);
          if (response.status === 'success' && Array.isArray(response.data) && response.data.length > 0) {
            // Map backend chat format to UI format
            this.chatMessagesMap[summary.id] = response.data.flatMap(chat => ([
              { type: 'user', content: chat.Question, timestamp: (chat as any).created_at || chat.id || new Date() },
              { type: 'assistant', content: chat.Answer, timestamp: (chat as any).created_at || chat.id || new Date() }
            ]));
          } else {
            this.chatMessagesMap[summary.id] = [
              { type: 'system', content: 'No previous chat history for this summary.', timestamp: new Date() }
            ];
            console.warn('No chat history found for this summary.');
          }
          this.isLoadingChatMap[summary.id] = false;
        },
        error: (err) => {
          this.chatMessagesMap[summary.id] = [
            { type: 'system', content: 'Failed to load chat history.', timestamp: new Date() }
          ];
          this.isLoadingChatMap[summary.id] = false;
          console.error('Failed to load chat history from backend:', err);
        }
      });
    } else {
      this.chatMessagesMap[summary.id] = [
        { type: 'system', content: 'No chat history available for text summaries.', timestamp: new Date() }
      ];
    }
  }

  closeChatModal() {
    this.showChatModal = false;
    this.chatModalSummary = null;
    this.chatModalType = null;
  }

  askQuestion(summaryId: number) {
    const question = this.currentQuestionMap[summaryId]?.trim();
    if (!question || this.isLoadingChatMap[summaryId]) {
      this.showEmptyTextWarning = true;
      return;
    }
    this.showEmptyTextWarning = false;
    this.isLoadingChatMap[summaryId] = true;
    // Add user message to UI
    if (!this.chatMessagesMap[summaryId]) this.chatMessagesMap[summaryId] = [];
    this.chatMessagesMap[summaryId].push({
      type: 'user',
      content: question,
      timestamp: new Date()
    });
    this.currentQuestionMap[summaryId] = '';
    // Call backend to get answer (simulate with a placeholder, replace with real API call)
    // For now, just use the first book summary's Book as BookId (should be summaryId)
    const bookSummary = this.bookSummaries.find(b => b.id === summaryId);
    if (!bookSummary) {
      this.chatMessagesMap[summaryId].push({
        type: 'assistant',
        content: 'Error: Book summary not found.',
        timestamp: new Date()
      });
      this.isLoadingChatMap[summaryId] = false;
      return;
    }
    // Simulate backend chat API (replace with your real chat API call)
    // Here you should call your BookApiService or similar to get the answer
    // For now, just use a placeholder answer
    const fakeAnswer = 'This is a placeholder answer from the assistant.';
    // Save to backend
    this.historyService.addChat({ BookId: summaryId, Question: question, Answer: fakeAnswer }).subscribe({
      next: () => {
        this.chatMessagesMap[summaryId].push({
          type: 'assistant',
          content: fakeAnswer,
          timestamp: new Date()
        });
        this.isLoadingChatMap[summaryId] = false;
      },
      error: () => {
        this.chatMessagesMap[summaryId].push({
          type: 'assistant',
          content: 'Failed to save chat to backend.',
          timestamp: new Date()
        });
        this.isLoadingChatMap[summaryId] = false;
      }
    });
  }

  handleQuestionKeyPress(event: KeyboardEvent, summaryId: number) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.askQuestion(summaryId);
    }
  }

  openQuizExpandModal(quiz: any) {
    this.expandedQuiz = quiz;
    this.showQuizExpandModal = true;
  }

  closeQuizExpandModal() {
    this.showQuizExpandModal = false;
    this.expandedQuiz = null;
  }
}
