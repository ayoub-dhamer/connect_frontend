import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';       // ✅ Import FormsModule
import { CommonModule } from '@angular/common';     
import { PaymentService } from '../../services/payment';

@Component({
  selector: 'app-payment',
  standalone: true,
  templateUrl: './payment.html',
  styleUrls: ['./payment.css'],
  imports: [CommonModule, FormsModule],             // ✅ Declare imports
})
export class PaymentComponent {
  amount = 0;
  productName = '';

  constructor(private paymentService: PaymentService) {}

  payNow() {
    if (this.amount > 0 && this.productName.trim()) {
      this.paymentService.createCheckoutSession(this.amount, this.productName);
    } else {
      alert('Please enter valid values');
    }
  }
}
