import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url('tasks'));
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(this.url(`tasks/${id}`));
  }

  create(task: any): Observable<any> {
    return this.http.post<any>(this.url('tasks'), task);
  }

  update(id: number, task: any): Observable<any> {
    return this.http.put<any>(this.url(`tasks/${id}`), task);
  }

  delete(id: number) {
    return this.http.delete<void>(this.url(`tasks/${id}`));
  }
}
