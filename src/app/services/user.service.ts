import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url('user'));
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(this.url(`user/${id}`));
  }

  delete(id: number) {
    return this.http.delete<void>(this.url(`user/${id}`));
  }
}
