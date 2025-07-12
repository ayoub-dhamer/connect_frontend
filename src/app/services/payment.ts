// src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadStripe } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private backendUrl = 'http://localhost:8080/api/payment';

  constructor(private http: HttpClient) {}

  async createCheckoutSession(amount: number, productName: string): Promise<void> {
    const stripe = await loadStripe('sk_test_51L9ej2Ggvr6fx2cn9mOhL60nrvh7MSkgVPtUBNySUjefNOpOpjU7ARgxZbcLBE6zxW7ZmoY1Rw3YQ8ygjCsksQ6N00ddaTN0kp');

    this.http
      .post<{ checkoutUrl: string }>(`${this.backendUrl}/create-checkout-session`, {
        amount,
        productName,
      })
      .subscribe((response) => {
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
        }
      });
  }
}
