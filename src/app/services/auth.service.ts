import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private user: any = null; // store user data in memory

  constructor(private http: HttpClient, private router: Router) {}

  /** 
   * FRONTEND NO LONGER HAS ACCESS TO JWT
   * We call backend to check session
   */
  loadUserProfile() {
    return this.http
      .get<any>('http://localhost:8080/api/auth/me', { withCredentials: true })
      .pipe(
        map((user) => {
          this.user = user;   // { name, email, roles, picture }
          return user;
        })
      );
  }

  /** 
   * Check if authenticated (cookie exists and is valid)
   */
  isAuthenticated(): boolean {
    return !!this.user;
  }

  /**
   * Get roles from user info
   */
  getRoles(): string[] {
    return this.user?.roles ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  /**
   * Logout → backend clears HttpOnly cookie
   */
  logout() {
    return this.http
      .post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true })
      .subscribe(() => {
        this.user = null;
        this.router.navigate(['/login']);
      });
  }
}
