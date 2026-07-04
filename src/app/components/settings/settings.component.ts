import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService, Theme } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { ToastMessageService } from '../../services/toast-message.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  currentTheme: Theme = 'system';
  currentLang = 'en';

  user: any = null;

  notifications = {
    email: true,
    taskAssigned: true,
    projectUpdates: false,
  };

  readonly themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '🖥️' },
  ];

  readonly languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  constructor(
    private themeService: ThemeService,
    private translate: TranslateService,
    private auth: AuthService,
    private toast: ToastMessageService,
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'en';

    this.auth.loadUser().subscribe((user) => {
      this.user = user;
    });
  }

  selectTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.themeService.setTheme(theme);
  }

  selectLang(code: string): void {
    this.currentLang = code;
    this.translate.use(code);
  }

  toggleNotification(key: keyof typeof this.notifications): void {
    this.notifications[key] = !this.notifications[key];
    // TODO: persist to backend once a /api/user/preferences endpoint exists
  }

  saveNotifications(): void {
    this.toast.success('Notification preferences saved');
  }

  logout(): void {
    this.auth.logout();
  }
}
