import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private api = 'http://localhost:8080/api/payments';

  constructor(private http: HttpClient) {}

  checkout(amount: number) {
    return this.http.post<any>(`${this.api}/create-checkout-session`, { amount }, { withCredentials: true });
  }
}