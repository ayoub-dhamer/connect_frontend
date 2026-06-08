import {
  Component,
  Input,
  OnInit,
  OnDestroy, // 1. Import OnDestroy for cleanup
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs'; // 2. Import Subject and takeUntil

export interface MenuItem {
  label: string;
  icon: string;
  link: string;
  roles: string[];
  badge?: number | null;
}

@Component({
  selector: 'app-side-nav-bar',
  templateUrl: './side-nav-bar.component.html',
  styleUrls: ['./side-nav-bar.component.scss'],
})
export class SideNavBarComponent implements OnInit, OnDestroy {
  // 3. Implement OnDestroy
  @Input() isExpanded = true;
  @Output() expandedChange = new EventEmitter<boolean>();

  currentLang!: string;
  langOpen = false;

  // 4. Change this back to a regular string array, initialized as empty
  userRoles: string[] = [];

  // A notifier stream to cleanly close subscriptions when component dies
  private destroy$ = new Subject<void>();

  menu: MenuItem[] = [
    {
      label: 'dashboardLabel',
      icon: 'dashboard',
      link: '/admin',
      roles: ['ROLE_ADMIN'],
      badge: null,
    },
    {
      label: 'usersLabel',
      icon: 'group',
      link: '/admin/users',
      roles: ['ROLE_ADMIN'],
      badge: 12,
    },
    {
      label: 'My Tasks',
      icon: 'task_alt',
      link: '/user/tasks',
      roles: ['ROLE_USER'],
      badge: 3,
    },
    {
      label: 'projectsLabel',
      icon: 'folder_open',
      link: '/user/projects',
      roles: ['ROLE_USER'],
      badge: null,
    },
    {
      label: 'settingsLabel',
      icon: 'settings',
      link: '/settings',
      roles: ['ROLE_ADMIN', 'ROLE_USER'],
      badge: null,
    },
  ];

  constructor(
    private translate: TranslateService,
    private auth: AuthService,
  ) {
    this.translate.setDefaultLang('en');
    this.currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'en';
  }

  ngOnInit(): void {
    // 5. Manually subscribe to the observable stream here
    this.auth
      .getRoles()
      .pipe(takeUntil(this.destroy$)) // Prevents memory leaks
      .subscribe({
        next: (roles) => {
          this.userRoles = roles; // Unpacks the stream into your array
        },
        error: (err) => console.error('Error fetching roles:', err),
      });
  }

  // 6. Clean up the subscription when the user leaves this component
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchLang(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    this.langOpen = false;
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.expandedChange.emit(this.isExpanded);
  }

  // 7. This remains perfectly clean and synchronous!
  canShow(item: MenuItem): boolean {
    return item.roles.some((role) => this.userRoles.includes(role));
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lang-wrapper')) {
      this.langOpen = false;
    }
  }
}
