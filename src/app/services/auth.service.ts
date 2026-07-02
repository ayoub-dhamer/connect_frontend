import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UserDTO {
  id: number;
  email: string;
  name: string;
  roles: string[];
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'CANCELLED';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  private currentUser$ = new BehaviorSubject<UserDTO | null>(null);

  loadUser(): Observable<UserDTO | null> {
    if (this.currentUser$.value) return this.currentUser$.asObservable();
    return this.http
      .get<UserDTO>(`${environment.apiUrl}/user/me`, { withCredentials: true })
      .pipe(
        tap((user) => this.currentUser$.next(user)),
        catchError(() => of(null)),
      );
  }

  getUser(): Observable<UserDTO | null> {
    return this.currentUser$.asObservable();
  }

  clearUser(): void {
    this.currentUser$.next(null);
  }

  loginWithGoogle(): void {
    window.location.href = environment.oauthUrl;
  }

  logout(): void {
    window.location.href = environment.logoutUrl;
  }

  // Backend verifies cookie

  getCurrentUser(): Observable<UserDTO | null> {
    return this.http
      .get<UserDTO>(`${environment.apiUrl}/user/me`, { withCredentials: true })
      .pipe(catchError(() => of(null)));
  }

  isAuthenticated(): Observable<boolean> {
    return this.getCurrentUser().pipe(map((user) => !!user));
  }

  hasActiveSubscription(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map((user) => user?.subscriptionStatus === 'ACTIVE'),
    );
  }

  getRoles(): Observable<string[]> {
    return this.getCurrentUser().pipe(map((user) => user?.roles ?? []));
  }

  /*logout() {
    return this.http.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true })
      .subscribe(() => {
        this.user = null;
        this.router.navigate(['/login']);
      });
  }*/
}
