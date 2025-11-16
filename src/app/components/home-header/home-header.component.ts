import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
import { Subscription } from 'rxjs';
import { ToastMessageService } from 'src/app/services/toast-message.service';
import { TranslateService } from '@ngx-translate/core';

declare var toggleNotifi: any;
declare var showNotif: any;
declare var hideNotif: any;

@Component({
  selector: 'app-home-header',
  templateUrl: './home-header.component.html',
  styleUrls: ['./home-header.component.scss']
})
export class HomeHeaderComponent {

  notificationsOpen: boolean = false;
profileOpen: boolean = false;

toggleNotifications() {
  this.notificationsOpen = !this.notificationsOpen;

  // Close profile dropdown when notifications open
  if (this.notificationsOpen) this.profileOpen = false;
}

toggleProfile() {
  this.profileOpen = !this.profileOpen;

  // Close notifications dropdown when profile opens
  if (this.profileOpen) this.notificationsOpen = false;
}



  @Output() toggleSidebarForMe: EventEmitter<any> = new EventEmitter();

  imageTest: boolean = false;
  imageSource!: any;
  userName: any;
  users: any;
  simpleUsersNumber: any;
  nb: number = 0;

  clickEventSubscription: Subscription;

  constructor(
    private router: Router,
    private toast: ToastMessageService,
    private http: HttpClient,
    private sharedService: SharedService,
    private translate: TranslateService
  ) {
    this.clickEventSubscription = this.sharedService
      .getClickEvent()
      .subscribe(() => {
        //this.ngOnInit();
      });

    //var language = this.authService.getLanguage();
    //translate.setDefaultLang(language);
  }

  toggleNotifi() {
    this.nb = this.nb + 1;
    //new toggleNotifi();
    if (this.nb % 2 != 0) {
      new showNotif();
    } else {
      new hideNotif();
    }
  }

 /* ngOnInit(): void {
    this.getAdminImage();
    new hideNotif();
  }

  getAdminImage() {
    this.adminService.getAdminImage(this.authService.getUserName()).subscribe(
      (res) => {
        if (res != '' && res != null && res != 'null') {
          this.imageSource = res;
          this.imageTest = true;
        } else {
          this.imageTest = false;
        }
      },
      (error: any) => {
        this.toast.error('' + error.error?.message, 'Something went wrong');
      }
    );
  }*/

  toggleSidebar() {
    this.toggleSidebarForMe.emit();
  }

/*  logOut() {
    localStorage.clear();
    this.router.navigate(['']);
    this.toast.success('You Have been Logged out of your account');
  }*/
}