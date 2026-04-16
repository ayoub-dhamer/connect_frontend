import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, Observable, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
  return this.auth.isAuthenticated().pipe(
    switchMap(isAuth => {
      if (!isAuth) return of(true); // not logged in, allow login page
      return this.auth.getRoles().pipe(
        map(roles => {
          if (roles.includes('ROLE_ADMIN')) this.router.navigate(['/admin']);
          else if (roles.includes('ROLE_USER')) this.router.navigate(['/user']);
          else this.router.navigate(['/unauthorized']);
          return false;
        })
      );
    })
  );
}
}
