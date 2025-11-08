import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm = '';
  loading = false;
  error?: string;

   pagedUsers: any[] = [];
    // Pagination variables
  currentPage = 1;
  pageSize = 5;
  pageSizes = [5, 10, 20];
  totalPages = 1;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter(
      u =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
     this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(start, end);
  }

   nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  deleteUser(user: any) {
    if (!confirm(`Delete ${user.email}?`)) return;
    this.userService.delete(user.id).subscribe(() => this.loadUsers());
  }
}
