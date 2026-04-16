import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PageResponse } from './project.service';

export interface User {
  id: number;
  email: string;
  name: string;
  pictureUrl: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  /** Load logged user from backend */
  loadUserProfile() {
    return this.http.get<User>(this.url('user/me'));
  }

  /** Get all users */
  getAll(page = 0, size = 10): Observable<PageResponse<any>> {
  return this.http.get<PageResponse<any>>(this.url('user'), this.options({ page, size }));
}

  /** Get a single user by ID */
 getById(id: number): Observable<any> {
  return this.http.get<any>(this.url(`user/${id}`), this.options());
}

  /** Delete a user */
 delete(id: number): Observable<void> {
  return this.http.delete<void>(this.url(`user/${id}`), this.options());
}
}
