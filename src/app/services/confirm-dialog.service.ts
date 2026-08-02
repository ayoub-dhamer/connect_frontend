import { Injectable } from '@angular/core';
import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
} from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private componentRef: ConfirmDialogComponent | null = null;

  /** Called once by ConfirmDialogComponent itself on init, to register the
   *  live instance this service should delegate to. */
  register(component: ConfirmDialogComponent): void {
    this.componentRef = component;
  }

  confirm(config: ConfirmDialogConfig): Promise<boolean> {
    if (!this.componentRef) {
      console.error(
        'ConfirmDialogComponent is not mounted — did you add <app-confirm-dialog> to a root layout?',
      );
      return Promise.resolve(false);
    }
    return this.componentRef.open(config);
  }
}
