import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  /** Get all users */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url('user'), { withCredentials: true });
  }

  /** Get a single user by ID */
  getById(id: number): Observable<any> {
    return this.http.get<any>(this.url(`user/${id}`), { withCredentials: true });
  }

  /** Delete a user */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`user/${id}`), { withCredentials: true });
  }
}
