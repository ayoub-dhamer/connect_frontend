import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ToastMessageService } from '../../services/toast-message.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  user: any;
  currentLang = 'en';

  constructor(
    private auth: AuthService,
    private toast: ToastMessageService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.auth.loadUser().subscribe(u => {
      this.user = u;
    });

    this.currentLang = this.translate.currentLang || 'en';
  }

  switchLang(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
  }

  logout(): void {
    this.auth.logout();
  }
}