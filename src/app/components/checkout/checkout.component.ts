import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastMessageService } from '../../services/toast-message.service';
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PK =
  'pk_test_51S5kHMGZ5UiJLAbdx1rULqKMoOILodlY4BnFZgpGHVHGeGOfLJHViNFTSiB9OKuC6zQWThMQmGjrd0zh0tekMQQT00AACFluRf';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {

  loading = false;

  constructor(
    private http: HttpClient,
    private toast: ToastMessageService
  ) {}

  pay(): void {
    this.loading = true;

    this.http.post<any>(
      'http://localhost:8080/api/payments/create-checkout-session',
      { amount: 20, productName: 'Pro Plan' },
      { withCredentials: true }
    ).subscribe({
      next: async (res) => {
        const stripe = await loadStripe(STRIPE_PK);

        if (res.url) {
          window.location.href = res.url;
        } else if (stripe && res.id) {
          await stripe.redirectToCheckout({ sessionId: res.id });
        }
      },
      error: () => {
        this.toast.error('Payment failed to initialize');
        this.loading = false;
      }
    });
  }
}