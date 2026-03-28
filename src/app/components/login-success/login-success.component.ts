import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login-success',
  templateUrl: './login-success.component.html',
  styleUrls: ['./login-success.component.css']
})
export class LoginSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // When redirected from Spring OAuth success → cookie is already set!
    this.userService.loadUserProfile().subscribe({
      next: user => {
        if (user.roles.includes("ROLE_ADMIN")) {
          this.router.navigate(['/admin']);
        } 
        else if (user.roles.includes("ROLE_USER")) {
          this.router.navigate(['/user']);
        } 
        else {
          this.router.navigate(['/unauthorized']);
        }
      },
      error: () => this.router.navigate(['/login'])
    });
  }
}
