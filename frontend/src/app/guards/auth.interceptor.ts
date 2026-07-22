import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, Subject } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshSubject: Subject<void> | null = null;
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !authService.getRefreshToken()) {
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshSubject = new Subject<void>();

        return authService.refreshAccessToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            refreshSubject!.next();
            refreshSubject!.complete();
            refreshSubject = null;

            const newToken = authService.getToken();
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshSubject?.error(refreshError);
            refreshSubject = null;
            authService.forceLogout();
            return throwError(() => refreshError);
          })
        );
      }

      return refreshSubject!.pipe(
        switchMap(() => {
          const newToken = authService.getToken();
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next(retryReq);
        })
      );
    })
  );
};
