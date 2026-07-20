import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toasts$ = new Subject<Toast>();

  get toasts() {
    return this.toasts$.asObservable();
  }

  success(message: string) {
    this.emit(message, 'success');
  }

  error(message: string) {
    this.emit(message, 'error');
  }

  info(message: string) {
    this.emit(message, 'info');
  }

  private emit(message: string, type: Toast['type']) {
    this.toasts$.next({ id: ++this.counter, message, type });
  }
}
