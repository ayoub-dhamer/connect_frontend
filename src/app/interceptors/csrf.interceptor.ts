// csrf.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(this.addToken(req)).pipe(
      catchError((error: HttpErrorResponse) => {
        // A 401/403 on a state-changing request MIGHT be a stale CSRF token
        // that just rotated — retry once with a freshly-read cookie value.
        if (
          (error.status === 401 || error.status === 403) &&
          req.method !== 'GET'
        ) {
          return next.handle(this.addToken(req));
        }
        return throwError(() => error);
      }),
    );
  }

  private addToken(req: HttpRequest<any>): HttpRequest<any> {
    const xsrfToken = document.cookie.match('(^| )XSRF-TOKEN=([^;]+)')?.[2];
    return req.clone({
      withCredentials: true,
      setHeaders: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {},
    });
  }
}
