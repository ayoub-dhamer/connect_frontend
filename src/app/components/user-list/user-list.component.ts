import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = false;
  error?: string;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: users => { this.users = users; this.loading = false; },
      error: err => { this.error = err.message || 'Failed to load users'; this.loading = false; }
    });
  }

  edit(u: any) { this.router.navigate(['/users', u.id]); }
  
  deleteUser(u: any) {
    if (!u.id || !confirm(`Delete ${u.email}?`)) return;
    this.userService.delete(u.id).subscribe(() => this.load());
  }
}
