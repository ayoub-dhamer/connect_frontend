import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { UserService } from '../../services/user.service';
import { ToastMessageService } from '../../services/toast-message.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  users: any[] = [];
  columns = ['name', 'email', 'roles', 'subscription', 'actions'];
  loading = false;

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  constructor(
    private userService: UserService,
    private toast: ToastMessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.userService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.users = res.content ?? res;
        this.totalElements = res.totalElements ?? this.users.length;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load users');
        this.loading = false;
      }
    });
  }

  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  delete(id: number): void {
    if (!confirm('Delete this user?')) return;

    this.userService.delete(id).subscribe({
      next: () => {
        this.toast.success('User deleted');
        this.load();
      },
      error: () => {
        this.toast.error('Cannot delete user');
      }
    });
  }
}