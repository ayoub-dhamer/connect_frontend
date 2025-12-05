import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isAuthenticated()) {
      const roles = this.auth.getRoles();

      if (roles.includes('ROLE_ADMIN')) {
        this.router.navigate(['/admin']);
      } 
      else if (roles.includes('ROLE_USER')) {
        this.router.navigate(['/user']);
      } 
      else {
        this.router.navigate(['/unauthorized']);
      }
      return false;
    }
    return true;
  }
}
