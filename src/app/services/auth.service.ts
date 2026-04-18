import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface UserDTO {
  id: number;
  email: string;
  name: string;
  roles: string[];
  subscriptionStatus: 'NONE' | 'ACTIVE' | 'CANCELLED';
}


@Injectable({ providedIn: 'root' })
export class AuthService {

  private user: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  private currentUser$ = new BehaviorSubject<UserDTO | null>(null);

loadUser(): Observable<UserDTO | null> {
  if (this.currentUser$.value) return this.currentUser$.asObservable();
  return this.http.get<UserDTO>('http://localhost:8080/api/user/me', { withCredentials: true }).pipe(
    tap(user => this.currentUser$.next(user)),
    catchError(() => of(null))
  );
}

getUser(): Observable<UserDTO | null> {
  return this.currentUser$.asObservable();
}

clearUser(): void {
  this.currentUser$.next(null);
}

  loginWithGoogle(): void {
    // Redirect to backend OAuth2 endpoint
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  logout(): void {
    // Backend clears HTTP-only cookie
    window.location.href = 'http://localhost:8080/logout';
  }

 // Backend verifies cookie   

  getCurrentUser(): Observable<UserDTO | null> {
  return this.http.get<UserDTO>('http://localhost:8080/api/user/me', { withCredentials: true }).pipe(
    catchError(() => of(null)) // ✅ 401 now returns null cleanly, no more CORS redirect
  );
}

  isAuthenticated(): Observable<boolean> {
    return this.getCurrentUser().pipe(map(user => !!user));
  }

  hasActiveSubscription(): Observable<boolean> {
    return this.getCurrentUser().pipe(map(user => user?.subscriptionStatus === 'ACTIVE'));
  }

  getRoles(): Observable<string[]> {
    return this.getCurrentUser().pipe(map(user => user?.roles ?? []));
  }





  

  /*logout() {
    return this.http.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true })
      .subscribe(() => {
        this.user = null;
        this.router.navigate(['/login']);
      });
  }*/
}
