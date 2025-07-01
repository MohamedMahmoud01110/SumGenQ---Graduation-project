import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { TextPageComponent } from './components/text-page/text-page.component';
import { BookPageComponent } from './components/book-page/book-page.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { LogInComponent } from './auth/log-in/log-in.component';
import { isLoggedGuard } from './guards/is-logged.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './guards/auth.guard';
import { SummaryResultComponent } from './components/summary-result/summary-result.component';
import { BookSummaryViewerComponent } from './components/book-summary-viewer/book-summary-viewer.component';
import { HistoryComponent } from './components/history/history.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { QuizViewerComponent } from './components/quiz-viewer/quiz-viewer.component';

export const routes: Routes = [
  {path: '', component: AuthLayoutComponent, canActivate:[isLoggedGuard] , children: [
    { path: '', component: HomeComponent, title: 'Text Summarizer' },
    {path: 'login', component: LogInComponent, title:'Text Summarization - Login'},
    {path: 'signup', component: SignUpComponent, title:'Text Summarization - Sign Up'},

  ]
  },
    {path:'', component: MainLayoutComponent, canActivate:[authGuard], children: [

  { path: '', component: HomeComponent, title: 'Text Summarizer' },
  { path: 'home', component: HomeComponent, title: 'Home' },
  { path: 'text', component: TextPageComponent, title: 'Text Page' },
  { path: 'book', component: BookPageComponent, title: 'Book Page' },
  { path: 'quiz', component: QuizComponent, title: 'Quiz Page' },
  { path: 'quiz-viewer', component: QuizViewerComponent, title: 'Quiz Viewer' },
  { path: 'about', component: AboutUsComponent, title: 'About Us' },
  { path: 'summary', component: BookSummaryViewerComponent, title: 'Summary Page' },
  { path: 'history', component: HistoryComponent, title: 'History' },
  // Removed signup and login routes from main layout - they should only be in auth layout
  // { path: '**', component: NotFoundComponent, title: 'Not Found' },
]},
  { path: '**', component: NotFoundComponent, title: 'Not Found' },
];
