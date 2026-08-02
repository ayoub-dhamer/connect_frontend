import { Component } from '@angular/core';
import { ConfirmDialogService } from 'src/app/services/confirm-dialog.service';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent {
  isOpen = false;
  config: ConfirmDialogConfig = { title: '', message: '' };

  constructor(private confirmDialogService: ConfirmDialogService) {}

  ngOnInit(): void {
    this.confirmDialogService.register(this);
  }

  private resolveFn: ((result: boolean) => void) | null = null;

  open(config: ConfirmDialogConfig): Promise<boolean> {
    this.config = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'default',
      ...config,
    };
    this.isOpen = true;

    return new Promise<boolean>((resolve) => {
      this.resolveFn = resolve;
    });
  }

  confirm(): void {
    this.isOpen = false;
    this.resolveFn?.(true);
    this.resolveFn = null;
  }

  cancel(): void {
    this.isOpen = false;
    this.resolveFn?.(false);
    this.resolveFn = null;
  }
}
