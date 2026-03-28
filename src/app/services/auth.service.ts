import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private user: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  loginWithGoogle(): void {
    // Redirect to backend OAuth2 endpoint
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  logout() {
    // backend cookie expires automatically, just reload
    window.location.href = 'http://localhost:4200';
  }

  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  hasRole(role: string): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.roles?.includes(role);
  }

  getRoles(): string[] {
  const token = this.getToken();
  if (!token) return [];

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Array.isArray(payload.roles) ? payload.roles : [];
  } catch (error) {
    console.error('Failed to parse JWT roles:', error);
    return [];
  }
}

  

  /*logout() {
    return this.http.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true })
      .subscribe(() => {
        this.user = null;
        this.router.navigate(['/login']);
      });
  }*/
}
