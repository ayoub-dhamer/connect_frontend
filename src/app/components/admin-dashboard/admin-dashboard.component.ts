import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  // ── Stats ──
  totalUsers = 0;
  totalProjects = 0;
  totalTasks = 0;
  activeSubscriptions = 0;

  // ── Table ──
  users: any[] = [];
  filteredUsers: any[] = [];
  pagedUsers: any[] = [];
  searchTerm = '';

  // ── State ──
  loading = false;
  error?: string;

  // ── Pagination ──
  currentPage = 1;
  pageSize = 5;
  pageSizes = [5, 10, 20];
  totalPages = 1;

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private taskService: TaskService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();

    this.projectService.getAll().subscribe((res: any) => {
      this.totalProjects = res.totalElements ?? (res.content ?? res).length;
    });

    this.taskService.getAll().subscribe((res: any) => {
      this.totalTasks = res.totalElements ?? (res.content ?? res).length;
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = undefined;

    this.userService.getAll().subscribe({
      next: (res: any) => {
        const users = res.content ?? res;
        this.totalUsers = res.totalElements ?? users.length;
        this.activeSubscriptions = users.filter(
          (u: any) => u.subscriptionStatus === 'ACTIVE',
        ).length;

        this.users = users;
        this.filteredUsers = users;
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load users';
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term),
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.max(
      1,
      Math.ceil(this.filteredUsers.length / this.pageSize),
    );
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  deleteUser(user: any): void {
    if (!confirm(`Delete ${user.email}?`)) return;
    this.userService.delete(user.id).subscribe(() => this.loadUsers());
  }
}
