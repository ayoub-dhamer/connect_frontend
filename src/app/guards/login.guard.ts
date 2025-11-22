import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      const roles = this.authService.getRoles();  // <-- array

      if (roles.includes('ROLE_ADMIN')) {
        this.router.navigate(['/admin']);
      } 
      else if (roles.includes('ROLE_USER')) {
        this.router.navigate(['/user']);
      } 
      else {
        this.router.navigate(['/unauthorized']);
      }

      return false; // block /login
    }

    return true; // allow /login if NOT authenticated
  }
}
   