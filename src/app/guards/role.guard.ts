import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const requiredRoles = route.data['roles'] as string[];

    return this.authService.loadUser().pipe(
      map(user => {
        // ✅ If no user (not authenticated), redirect to login
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        // ✅ If authenticated but wrong role, redirect to unauthorized
        const allowed = requiredRoles.some(r => user.roles.includes(r));
        if (!allowed) this.router.navigate(['/unauthorized']);
        return allowed;
      })
    );
  }
}