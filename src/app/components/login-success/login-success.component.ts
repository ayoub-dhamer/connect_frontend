import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-success',
  template: `<p>Logging in...</p>`
})
export class LoginSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.saveToken(token);
        console.log(this.authService.getRoles());
        if(this.authService.getRoles().includes('ROLE_ADMIN')){
          this.router.navigate(['/admin']); // go to home/dashboard
        }
        if(this.authService.getRoles().includes('ROLE_USER')){
          this.router.navigate(['/user']); // go to home/dashboard
        }
        
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
