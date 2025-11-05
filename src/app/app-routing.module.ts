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

/*export const routes: Routes = [
  //{ path: '', component: App },
  { path: 'home', component: PaymentComponent },
  { path: 'success', component: SuccessComponent },
  { path: 'cancel', component: CancelComponent },

  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' }
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'unauthorized', component: UnauthorizedComponent }
];*/

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login-success', component: LoginSuccessComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [RoleGuard],
     data: { roles: ['ROLE_ADMIN'] },
     children: [
      {
        path: '',
        component: AdminDashboardComponent,
        canActivate: [AuthGuard],
        data: {
          roles: ['ROLE_ADMIN'],
        },
      },
      { path: 'users', component: UserListComponent, canActivate: [RoleGuard],
     data: { roles: ['ROLE_ADMIN'] } },
    ]
  },
  {
    path: 'user',
    component: UserComponent,
    canActivate: [RoleGuard],
     data: { roles: ['ROLE_USER'] }
  },
  { path: 'payment', component: PaymentComponent },
   { path: 'video', component: VideoCallComponent },
  { path: 'chat', component: ChatComponent },

  
  { path: 'projects', component: ProjectListComponent },
  { path: 'projects/new', component: ProjectFormComponent },
  { path: 'projects/:id', component: ProjectFormComponent },
  { path: 'tasks', component: TaskListComponent },
  { path: 'tasks/new', component: TaskFormComponent },
  { path: 'tasks/:id', component: TaskFormComponent },

  { path: 'side', component: SideNavBarComponent },

  /*{
    path: 'user',
    component: UserComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER', 'ROLE_ADMIN'] }
  },*/
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
