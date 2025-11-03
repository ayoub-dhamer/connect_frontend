import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: any): boolean {
    const expectedRoles: string[] = route.data['roles'];
    if (this.authService.isAuthenticated() && expectedRoles.some(r => this.authService.hasRole(r))) {
      return true;
    }
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
