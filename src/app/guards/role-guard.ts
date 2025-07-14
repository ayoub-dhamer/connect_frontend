// src/app/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Auth } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data['role'];
    const userRole = this.auth.getUserRole();

    if (userRole === expectedRole || (expectedRole === 'USER' && userRole === 'ADMIN')) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
