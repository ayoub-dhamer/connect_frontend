import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SuccessComponent } from './components/success/success.component';
import { CancelComponent } from './components/cancel/cancel.component';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
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

import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginGuard } from './guards/login.guard';
import { HomeComponent } from './components/home/home.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { SettingsComponent } from './components/settings/settings.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  {
    path: 'login-success',
    component: LoginSuccessComponent,
    canActivate: [AuthGuard],
  },

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

  {
    path: 'user',
    component: UserComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_USER'] },
    children: [
      { path: '', component: UserDashboardComponent },
      { path: 'projects', component: ProjectListComponent },
      { path: 'projects/new', component: ProjectFormComponent },
      { path: 'projects/:id', component: ProjectFormComponent },

      { path: 'tasks', component: TaskListComponent },
      { path: 'tasks/new', component: TaskFormComponent },
      { path: 'tasks/:id', component: TaskFormComponent },

      { path: 'chat', component: ChatComponent },
      {
        path: 'video/:roomId',
        component: VideoCallComponent,
        runGuardsAndResolvers: 'always',
      },

      { path: 'profile', component: UserProfileComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },

  {
    path: 'payment-success',
    component: SuccessComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'payment-cancel',
    component: CancelComponent,
    canActivate: [AuthGuard],
  },

  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '', component: HomeComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
