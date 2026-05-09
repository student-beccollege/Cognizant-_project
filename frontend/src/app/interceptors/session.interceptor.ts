import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Send the JSESSIONID cookie on every request so the server can resolve the session.
  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthCall = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');
      if (err.status === 401 && !isAuthCall) {
        localStorage.clear();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
