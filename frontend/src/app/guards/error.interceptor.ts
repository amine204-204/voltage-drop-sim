import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_username');
        localStorage.removeItem('auth_role');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

export function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) return 'Unable to connect to server.';
  if (error.status === 401) return 'Session expired. Please log in again.';
  if (error.status === 403) return 'You do not have permission to perform this action.';
  if (error.status === 404) return 'The requested resource was not found.';

  const body = error.error;
  if (body) {
    if (typeof body === 'string') return body;
    if (body.error) return body.error;
    if (body.message) return body.message;
  }

  if (error.status >= 500) return 'A server error occurred. Please try again later.';

  return `Request failed (${error.status}).`;
}
