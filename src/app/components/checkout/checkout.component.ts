import { Component } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-checkout',
  template: `<button (click)="pay()">Pay $20</button>`
})
export class CheckoutComponent {

  constructor(private payments: PaymentService) {}

  pay() {
    this.payments.checkout(20).subscribe(res => {
      window.location.href = res.url;
    });
  }
}