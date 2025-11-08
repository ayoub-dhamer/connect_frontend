import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminComponent } from './components/admin/admin.component';
import { CancelComponent } from './components/cancel/cancel.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { PaymentComponent } from './components/payment/payment.component';
import { SuccessComponent } from './components/success/success.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { LoginSuccessComponent } from './components/login-success/login-success.component';
import { ChatComponent } from './components/chat/chat.component';
import { VideoCallComponent } from './components/video-call/video-call.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { ProjectFormComponent } from './components/project-form/project-form.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { SideNavBarComponent } from './components/side-nav-bar/side-nav-bar.component';
import { HomeHeaderComponent } from './components/home-header/home-header.component';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSortModule } from '@angular/material/sort';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from './translate-loader.factory';
import { UserComponent } from './components/user/user.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    AdminComponent,
    CancelComponent,
    DashboardComponent,
    LoginComponent,
    PaymentComponent,
    SuccessComponent,
    UnauthorizedComponent,
    LoginSuccessComponent,
    ChatComponent,
    VideoCallComponent,
    UserListComponent,
    ProjectListComponent,
    TaskListComponent,
    ProjectFormComponent,
    TaskFormComponent,
    SideNavBarComponent,
    HomeHeaderComponent,
    UserComponent,
    AdminDashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule, 
    ReactiveFormsModule,

    MatButtonModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatMenuModule,
    MatBadgeModule,
    ScrollingModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatSortModule,
    MatPaginatorModule,
    BrowserAnimationsModule,

    MatListModule,

    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'en'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
