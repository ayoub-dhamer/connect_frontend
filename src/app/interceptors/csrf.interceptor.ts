import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptorFn: HttpInterceptorFn = (req, next) => {
  const xsrfToken = document.cookie.match('(^| )XSRF-TOKEN=([^;]+)')?.[2];
  return next(req.clone({
    withCredentials: true,
    setHeaders: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}
  }));
};

export { HttpInterceptorFn };
