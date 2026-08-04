import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number; // ms, 0 = never auto-dismiss
  title?: string;
}

export interface Toast extends Required<Omit<ToastConfig, 'title'>> {
  id: number;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  public toasts = this.toasts$.asObservable();

  private nextId = 0;
  private readonly DEFAULT_DURATION = 3500;
  private readonly DEFAULT_POSITION: ToastPosition = 'bottom-right';

  show(config: ToastConfig): number {
    const toast: Toast = {
      id: this.nextId++,
      message: config.message,
      type: config.type ?? 'info',
      position: config.position ?? this.DEFAULT_POSITION,
      duration: config.duration ?? this.DEFAULT_DURATION,
      title: config.title,
    };

    this.toasts$.next([...this.toasts$.value, toast]);

    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.duration);
    }

    return toast.id;
  }

  dismiss(id: number): void {
    this.toasts$.next(this.toasts$.value.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    this.toasts$.next([]);
  }

  // ── Convenience shorthands ──────────────────────────────

  success(message: string, config?: Partial<ToastConfig>): number {
    return this.show({ ...config, message, type: 'success' });
  }

  error(message: string, config?: Partial<ToastConfig>): number {
    return this.show({ ...config, message, type: 'error' });
  }

  warning(message: string, config?: Partial<ToastConfig>): number {
    return this.show({ ...config, message, type: 'warning' });
  }

  info(message: string, config?: Partial<ToastConfig>): number {
    return this.show({ ...config, message, type: 'info' });
  }
}
