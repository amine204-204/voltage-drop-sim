import { describe, it, expect } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from './error.interceptor';

function makeError(status: number, body?: any): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    error: body,
  });
}

describe('getErrorMessage', () => {
  it('returns connection error for status 0', () => {
    expect(getErrorMessage(makeError(0))).toBe('Unable to connect to server.');
  });

  it('returns string body directly', () => {
    expect(getErrorMessage(makeError(400, 'Bad input'))).toBe('Bad input');
  });

  it('returns body.error field', () => {
    expect(getErrorMessage(makeError(400, { error: 'Invalid name' }))).toBe('Invalid name');
  });

  it('returns body.message field', () => {
    expect(getErrorMessage(makeError(400, { message: 'Too short' }))).toBe('Too short');
  });

  it('returns session expired for 401', () => {
    expect(getErrorMessage(makeError(401))).toBe('Session expired. Please log in again.');
  });

  it('returns permission error for 403', () => {
    expect(getErrorMessage(makeError(403))).toBe('You do not have permission to perform this action.');
  });

  it('returns not found for 404', () => {
    expect(getErrorMessage(makeError(404))).toBe('The requested resource was not found.');
  });

  it('returns conflict message for 409', () => {
    expect(getErrorMessage(makeError(409, { error: 'Name taken' }))).toBe('Name taken');
  });

  it('returns generic conflict for 409 without body', () => {
    expect(getErrorMessage(makeError(409))).toBe('A conflict occurred.');
  });

  it('returns server error for 500', () => {
    expect(getErrorMessage(makeError(500))).toBe('A server error occurred. Please try again later.');
  });

  it('returns server error for 502', () => {
    expect(getErrorMessage(makeError(502))).toBe('A server error occurred. Please try again later.');
  });

  it('returns generic fallback for unknown status', () => {
    expect(getErrorMessage(makeError(418))).toBe('Request failed (418).');
  });
});
