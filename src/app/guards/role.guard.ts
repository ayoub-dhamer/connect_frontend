import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: any): boolean {
    const requiredRoles: string[] = route.data['roles'];

    if (this.auth.isAuthenticated() && requiredRoles.some(r => this.auth.hasRole(r))) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}

