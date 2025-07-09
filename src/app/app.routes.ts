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
    { path: '', component: HomeComponent, title: 'SumGenQ - Home' },
    {path: 'login', component: LogInComponent, title:'SumGenQ - Login'},
    {path: 'signup', component: SignUpComponent, title:'SumGenQ - Sign Up'},

  ]
  },
    {path:'', component: MainLayoutComponent, canActivate:[authGuard], children: [

  { path: '', component: HomeComponent, title: 'SumGenQ' },
  { path: 'home', component: HomeComponent, title: 'SumGenQ-Home' },
  { path: 'text', component: TextPageComponent, title: 'SumGenQ-Text Page' },
  { path: 'book', component: BookPageComponent, title: 'SumGenQ-Book Page' },
  { path: 'quiz', component: QuizComponent, title: 'SumGenQ-Quiz Page' },
  { path: 'quiz-viewer', component: QuizViewerComponent, title: 'SumGenQ-Quiz Viewer' },
  { path: 'about', component: AboutUsComponent, title: 'SumGenQ-About Us' },
  { path: 'summary', component: BookSummaryViewerComponent, title: 'SumGenQ-Summary Page' },
  { path: 'history', component: HistoryComponent, title: 'SumGenQ-History' },
  // Removed signup and login routes from main layout - they should only be in auth layout
  // { path: '**', component: NotFoundComponent, title: 'Not Found' },
]},
  { path: '**', component: NotFoundComponent, title: 'Not Found' },
];
