import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent {
  loading = false;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  pay(): void {
    this.loading = true;

    this.http
      .post<any>(
        `${environment.apiUrl}/payments/create-checkout-session`,
        { amount: 20, productName: 'Pro Plan' },
        { withCredentials: true },
      )
      .subscribe({
        next: async (res) => {
          const stripe = await loadStripe(environment.stripePublishableKey);

          if (res.url) {
            window.location.href = res.url;
          } else if (stripe && res.id) {
            await stripe.redirectToCheckout({ sessionId: res.id });
          }
        },
        error: () => {
          this.toast.error('Payment failed to initialize');
          this.loading = false;
        },
      });
  }
}
