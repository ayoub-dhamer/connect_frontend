import { Component } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { loadStripe } from '@stripe/stripe-js';
import { StripeService } from 'src/app/services/stripe.service';
import { HttpClient } from '@angular/common/http';

declare var Stripe: any;

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent {

  constructor(private http: HttpClient) { }

   

  subscribe(): void {
    this.http.post<{ sessionId: string }>('/api/create-checkout-session', {}, { withCredentials: true })
      .subscribe(res => {
        const stripe = Stripe('pk_test_51S5kHMGZ5UiJLAbdx1rULqKMoOILodlY4BnFZgpGHVHGeGOfLJHViNFTSiB9OKuC6zQWThMQmGjrd0zh0tekMQQT00AACFluRf'); // your Stripe publishable key
        stripe.redirectToCheckout({ sessionId: res.sessionId });
      });
  }
}
