import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PaymentComponent } from './components/payment/payment.component';
import { SuccessComponent } from './components/success/success.component';
import { CancelComponent } from './components/cancel/cancel.component';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminComponent } from './components/admin/admin.component';
import { UserComponent } from './components/user/user.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

import { LoginSuccessComponent } from './components/login-success/login-success.component';
import { ChatComponent } from './components/chat/chat.component';
import { VideoCallComponent } from './components/video-call/video-call.component';

import { UserListComponent } from './components/user-list/user-list.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { ProjectFormComponent } from './components/project-form/project-form.component';
import { TaskFormComponent } from './components/task-form/task-form.component';

import { SideNavBarComponent } from './components/side-nav-bar/side-nav-bar.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginGuard } from './guards/login.guard';
import { HomeComponent } from './components/home/home.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { CheckoutComponent } from './components/checkout/checkout.component';

const routes: Routes = [

  // --------------------
  // AUTH
  // --------------------
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  { path: 'login-success', component: LoginSuccessComponent, canActivate: [AuthGuard] },

  // --------------------
  // ADMIN AREA
  // --------------------
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: UserListComponent },
    ],
  },

  // --------------------
  // USER AREA
  // --------------------
  {
    path: 'user',
    component: UserComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER'] },
    children: [
      { path: '', component: DashboardComponent },
      { path: 'projects', component: ProjectListComponent },
      { path: 'profile', component: UserProfileComponent },
    ],
  },

  // --------------------
  // PROJECTS & TASKS
  // --------------------
  {
    path: 'projects/new',
    component: ProjectFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER'] },
  },
  {
    path: 'projects/:id',
    component: ProjectFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER'] },
  },

  {
    path: 'tasks',
    component: TaskListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER'] },
  },
  {
    path: 'tasks/new',
    component: TaskFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER'] },
  },
  {
    path: 'tasks/:id',
    component: TaskFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER'] },
  },

  // --------------------
  // REALTIME FEATURES
  // --------------------
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'video/:roomId', component: VideoCallComponent, canActivate: [AuthGuard] },

  // --------------------
  // PAYMENTS
  // --------------------
  {
    path: 'payment',
    component: PaymentComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER'] },
  },
  { path: 'payment-success', component: SuccessComponent, canActivate: [AuthGuard] },
  { path: 'payment-cancel', component: CancelComponent, canActivate: [AuthGuard] },

  // --------------------
  // MISC
  // --------------------
  { path: 'unauthorized', component: UnauthorizedComponent },

  // --------------------
  // FALLBACK (MUST BE LAST)   
  // --------------------
  { path: '', component: HomeComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: '**', component: PageNotFoundComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
