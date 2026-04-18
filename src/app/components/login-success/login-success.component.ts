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
  constructor(private auth: AuthService, private router: Router) {}
 
  ngOnInit(): void {
    this.auth.loadUser().subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      if (user.roles.includes('ROLE_ADMIN')) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/user']);
      }
    });
  }
}
