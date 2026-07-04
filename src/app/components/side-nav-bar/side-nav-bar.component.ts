import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { TaskService } from '../../services/task.service';
import { Subject, takeUntil, forkJoin, map } from 'rxjs';

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
  @Input() isExpanded = true;
  @Output() expandedChange = new EventEmitter<boolean>();

  currentLang!: string;
  langOpen = false;
  userRoles: string[] = [];

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
      badge: null,
    },
    {
      label: 'settingsLabel',
      icon: 'settings',
      link: '/admin/settings',
      roles: ['ROLE_ADMIN'],
      badge: null,
    },
    {
      label: 'dashboardLabel',
      icon: 'dashboard',
      link: '/user',
      roles: ['ROLE_USER'],
      badge: null,
    },
    {
      label: 'projectsLabel',
      icon: 'folder_open',
      link: '/user/projects',
      roles: ['ROLE_USER'],
      badge: null,
    },
    {
      label: 'tasksLabel',
      icon: 'task_alt',
      link: '/user/tasks',
      roles: ['ROLE_USER'],
      badge: null,
    },
    {
      label: 'settingsLabel',
      icon: 'settings',
      link: '/user/settings',
      roles: ['ROLE_USER'],
      badge: null,
    },
  ];

  constructor(
    private translate: TranslateService,
    private auth: AuthService,
    private projectService: ProjectService,
    private userService: UserService,
    private taskService: TaskService,
  ) {
    this.translate.setDefaultLang('en');
    this.currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'en';
  }

  ngOnInit(): void {
    this.auth
      .getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.userRoles = roles;
          this.fetchDynamicBadges();
        },
        error: (err) => console.error('Error fetching roles:', err),
      });
  }

  fetchDynamicBadges(): void {
    // Request minimal data sizing (size=1) just to acquire the total counts safely
    const usersCount$ = this.userService
      .getAll(0, 1)
      .pipe(map((res) => res.totalElements));
    const projectsCount$ = this.projectService
      .getAll(0, 1)
      .pipe(map((res) => res.totalElements));
    const tasksCount$ = this.taskService
      .getAll(0, 1)
      .pipe(map((res) => res.totalElements));

    forkJoin({
      users: usersCount$,
      projects: projectsCount$,
      tasks: tasksCount$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (counts) => {
          this.updateBadge('/admin/users', counts.users);
          this.updateBadge('/user/projects', counts.projects);
          this.updateBadge('/user/tasks', counts.tasks);
        },
        error: (err) => console.error('Error updating menu badges:', err),
      });
  }

  private updateBadge(link: string, count: number): void {
    const item = this.menu.find((m) => m.link === link);
    if (item) {
      // If count is zero, keep badge hidden
      item.badge = count > 0 ? count : null;
    }
  }

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

  canShow(item: MenuItem): boolean {
    return item.roles.some((role) => this.userRoles.includes(role));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lang-wrapper')) {
      this.langOpen = false;
    }
  }
}
