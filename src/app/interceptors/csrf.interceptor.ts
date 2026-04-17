// csrf.interceptor.ts — class-based for NgModule compatibility
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const xsrfToken = document.cookie.match('(^| )XSRF-TOKEN=([^;]+)')?.[2];

    return next.handle(req.clone({
      withCredentials: true,
      setHeaders: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}
    }));
  }
}