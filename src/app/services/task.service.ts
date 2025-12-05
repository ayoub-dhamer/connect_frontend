import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  /** Get all tasks */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url('tasks'), { withCredentials: true });
  }

  /** Get task by ID */
  getById(id: number): Observable<any> {
    return this.http.get<any>(this.url(`tasks/${id}`), { withCredentials: true });
  }

  /** Create new task */
  create(task: any): Observable<any> {
    return this.http.post<any>(this.url('tasks'), task, { withCredentials: true });
  }

  /** Update existing task */
  update(id: number, task: any): Observable<any> {
    return this.http.put<any>(this.url(`tasks/${id}`), task, { withCredentials: true });
  }

  /** Delete task by ID */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`tasks/${id}`), { withCredentials: true });
  }
}
