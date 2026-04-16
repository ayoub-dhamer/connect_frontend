// src/app/guards/subscription.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastMessageService } from '../services/toast-message.service';

@Injectable({ providedIn: 'root' })
export class SubscriptionGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router, private toast: ToastMessageService) {}

  canActivate(): Observable<boolean> {
    return this.auth.hasActiveSubscription().pipe(
      tap(active => {
        if (!active) {
          this.toast.warning('You need an active subscription to access this page.');
          this.router.navigate(['/payment']);
        }
      })
    );
  }
}