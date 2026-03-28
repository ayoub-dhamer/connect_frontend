export interface CsrfInterceptor {
}
// csrf.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler
} from '@angular/common/http';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const xsrfToken = this.getCookie('XSRF-TOKEN');

    let cloned = req.clone({
      withCredentials: true, // 🔑 sends JWT cookie
      setHeaders: xsrfToken
        ? { 'X-XSRF-TOKEN': xsrfToken }
        : {}
    });

    return next.handle(cloned);
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
}