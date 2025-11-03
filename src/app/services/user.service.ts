import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url('users'));
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(this.url(`users/${id}`));
  }

  create(user: any): Observable<any> {
    return this.http.post<any>(this.url('users'), user);
  }

  update(id: number, user: any): Observable<any> {
    return this.http.put<any>(this.url(`users/${id}`), user);
  }

  delete(id: number) {
    return this.http.delete<void>(this.url(`users/${id}`));
  }
}
