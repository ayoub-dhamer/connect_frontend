import { Component } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent {
  private stripePromise = loadStripe('pk_test_51S5kHMGZ5UiJLAbdx1rULqKMoOILodlY4BnFZgpGHVHGeGOfLJHViNFTSiB9OKuC6zQWThMQmGjrd0zh0tekMQQT00AACFluRf'); 
  // ⚠️ Use your Stripe **publishable key** from the Dashboard

  amount: number = 2000; // default: $20

  constructor(private paymentService: PaymentService) {}

  async pay() {
    const stripe = await this.stripePromise;

    this.paymentService.createCheckoutSession(this.amount).subscribe(async session => {
      await stripe?.redirectToCheckout({ sessionId: session.id });
    }, error => {
      console.error('Payment session creation failed', error);
    });
  }
}
