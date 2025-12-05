import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private user: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  /** Load logged user from backend */
  loadUserProfile() {
    return this.http.get('http://localhost:8080/api/auth/me', { withCredentials: true })
      .pipe(
        tap((user: any) => this.user = user)
      );
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  getRoles(): string[] {
    return this.user?.roles ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  logout() {
    return this.http.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true })
      .subscribe(() => {
        this.user = null;
        this.router.navigate(['/login']);
      });
  }
}
