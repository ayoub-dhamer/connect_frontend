import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm = '';
  loading = false;
  error?: string;

  displayedColumns = ['email', 'name', 'roles', 'actions'];

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void { this.load(); }


  load(){
      this.loading = true;
      this.userService.getAll().subscribe({
      next: users => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
      },
      error: err => {
        this.error = err.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.email.toLowerCase().includes(term) ||
      (u.name && u.name.toLowerCase().includes(term))
    );
  }

  deleteUser(u: any): void {
    if (!u.id || !confirm(`Delete ${u.email}?`)) return;
    this.userService.delete(u.id).subscribe(() => this.load());
  }
}
