import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  HostListener,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
import { Subscription } from 'rxjs';
import { ToastMessageService } from 'src/app/services/toast-message.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home-header',
  templateUrl: './home-header.component.html',
  styleUrls: ['./home-header.component.scss'],
})
export class HomeHeaderComponent implements OnInit {
  @Output() toggleSidebarForMe = new EventEmitter<void>();

  // UI state
  notificationsOpen = false;
  profileOpen = false;

  // User data
  userName = '';
  userEmail = '';
  userPlan: 'Free' | 'Pro' = 'Free';
  imageSource: string | null = null;
  imageTest = false;

  // Notifications
  users: { fullName: string; email: string }[] = [];
  get simpleUsersNumber(): number {
    return this.users.length;
  }

  private clickEventSubscription: Subscription;

  constructor(
    private router: Router,
    private toast: ToastMessageService,
    private http: HttpClient,
    private sharedService: SharedService,
    private translate: TranslateService,
    private authService: AuthService,
  ) {
    this.clickEventSubscription = this.sharedService
      .getClickEvent()
      .subscribe(() => {
        this.loadUserData();
      });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  // ── Data ────────────────────────────────────────────────────

  loadUserData(): void {
    this.userName = 'Ahmedsvstevtztzveve'; //this.authService.getUserName() ?? '';
    this.userEmail = 'Sghir'; //this.authService.getUserEmail() ?? '';
    this.userPlan = 'Free'; //this.authService.getUserPlan() ?? 'Free';
    this.loadUserImage();
  }

  loadUserImage(): void {
    // Uncomment and adapt when your image service is ready:
    // this.adminService.getAdminImage(this.userName).subscribe({
    //   next: (res) => {
    //     if (res && res !== 'null') {
    //       this.imageSource = res;
    //       this.imageTest = true;
    //     } else {
    //       this.imageTest = false;
    //     }
    //   },
    //   error: (err) => this.toast.error(err.error?.message, 'Something went wrong')
    // });
  }

  // ── Helpers ─────────────────────────────────────────────────

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  // ── Dropdown toggles ─────────────────────────────────────────

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) this.profileOpen = false;
  }

  toggleProfile(): void {
    this.profileOpen = !this.profileOpen;
    if (this.profileOpen) this.notificationsOpen = false;
  }

  closeAll(): void {
    this.notificationsOpen = false;
    this.profileOpen = false;
  }

  markAllRead(): void {
    this.users = [];
  }

  viewAllNotifications(): void {
    this.notificationsOpen = false;
    this.router.navigate(['/notifications']);
  }

  // ── Sidebar ──────────────────────────────────────────────────

  toggleSidebar(): void {
    this.toggleSidebarForMe.emit();
  }

  // ── Auth ─────────────────────────────────────────────────────

  disconnect(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ── Cleanup ──────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.clickEventSubscription.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.notificationsOpen = false;
      this.profileOpen = false;
    }
  }
}
