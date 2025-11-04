import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastMessageService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: ['snack-success']
    });
  }

  error(message: string) {
    this.snackBar.open(message, 'ERROR', {
      duration: 3000,
      panelClass: ['snack-error']
    });
  }

  warning(message: string) {
    this.snackBar.open(message, 'Warning', {
      duration: 3000,
      panelClass: ['snack-warning']
    });
  }

  info(message: string) {
    this.snackBar.open(message, 'Info', {
      duration: 3000,
      panelClass: ['snack-info']
    });
  }
}