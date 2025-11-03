import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8080/api/payments';

  constructor(private http: HttpClient) {}

  createCheckoutSession(amount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-checkout-session`, { amount });
  }
}
