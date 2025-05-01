import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { TextPageComponent } from './components/text-page/text-page.component';
import { BookPageComponent } from './components/book-page/book-page.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { LogInComponent } from './auth/log-in/log-in.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Text Summarizer' },
  { path: 'home', component: HomeComponent, title: 'Home' },
  { path: 'text', component: TextPageComponent, title: 'Text Page' },
  { path: 'book', component: BookPageComponent, title: 'Book Page' },
  { path: 'about', component: AboutUsComponent, title: 'About Us' },
  {path:'signup',component:SignUpComponent, title: 'Sign Up'},
  {path:'login',component:LogInComponent, title: 'Log In'},
  { path: '**', component: NotFoundComponent, title: 'Not Found' },
];
