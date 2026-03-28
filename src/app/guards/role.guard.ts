import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(private userService: UserService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const requiredRoles = route.data['roles'] as string[];

    return this.userService.loadUserProfile().pipe(
      map(user => {
        const allowed = requiredRoles.some(r => user.roles.includes(r));
        if (!allowed) this.router.navigate(['/unauthorized']);
        return allowed;
      })
    );
  }
}