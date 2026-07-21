import { HttpErrorResponse } from '@angular/common/http';

export function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) return 'Unable to connect to server.';

  const body = error.error;
  if (body) {
    if (typeof body === 'string') return body;
    if (body.error) return body.error;
    if (body.message) return body.message;
  }

  if (error.status === 401) return 'Session expired. Please log in again.';
  if (error.status === 403) return 'You do not have permission to perform this action.';
  if (error.status === 404) return 'The requested resource was not found.';
  if (error.status === 409) return body?.error || 'A conflict occurred.';
  if (error.status >= 500) return 'A server error occurred. Please try again later.';

  return `Request failed (${error.status}).`;
}
