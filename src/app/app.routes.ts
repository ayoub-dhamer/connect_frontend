// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { PaymentComponent } from './components/payment/payment';
import { Success } from './components/success/success';
import { Cancel } from './components/cancel/cancel';
import { App } from './app';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Admin } from './components/admin/admin';
import { Unauthorized } from './components/unauthorized/unauthorized';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';

export const routes: Routes = [
  //{ path: '', component: App },
  { path: 'home', component: PaymentComponent },
  { path: 'success', component: Success },
  { path: 'cancel', component: Cancel },

  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  {
    path: 'admin',
    component: Admin,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' }
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'unauthorized', component: Unauthorized }
];


