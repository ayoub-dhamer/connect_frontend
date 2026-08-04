import { Component } from '@angular/core';
import {
  Toast,
  ToastPosition,
  ToastService,
} from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css'],
})
export class ToastContainerComponent {
  positions: ToastPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];

  constructor(public toastService: ToastService) {}

  toastsFor(position: ToastPosition, all: Toast[]): Toast[] {
    return all.filter((t) => t.position === position);
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  iconFor(type: string): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }
}
