import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.css'],
})
export class UnauthorizedComponent {
  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  goHome(): void {
    this.auth.getRoles().subscribe((roles) => {
      if (roles.includes('ROLE_ADMIN')) {
        this.router.navigate(['/admin']);
      } else if (roles.includes('ROLE_USER')) {
        this.router.navigate(['/user']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
