// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { PaymentComponent } from './components/payment/payment';
import { Success } from './components/success/success';
import { Cancel } from './components/cancel/cancel';
import { App } from './app';

export const routes: Routes = [
  { path: '', component: App },
  { path: 'home', component: PaymentComponent },
  { path: 'success', component: Success },
  { path: 'cancel', component: Cancel },
];
