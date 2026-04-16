import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from './project.service';

@Injectable({ providedIn: 'root' })
export class TaskService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  /** Get all tasks */
  getAll(page = 0, size = 10): Observable<PageResponse<any>> {
  return this.http.get<PageResponse<any>>(this.url('tasks'), this.options({ page, size }));
}

  /** Get task by ID */
  getById(id: number): Observable<any> {
  return this.http.get<any>(this.url(`tasks/${id}`), this.options());
}

create(task: any): Observable<any> {
  return this.http.post<any>(this.url('tasks'), task, this.options());
}

  /** Update existing task */
  update(id: number, task: any): Observable<any> {
  return this.http.put<any>(this.url(`tasks/${id}`), task, this.options());
}

delete(id: number): Observable<void> {
  return this.http.delete<void>(this.url(`tasks/${id}`), this.options());
}
}
