import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjectService extends ApiService {

  constructor(protected override http: HttpClient) {
    super(http);
  }

  /** Get all projects */
 getAll(page = 0, size = 10): Observable<PageResponse<any>> {
  return this.http.get<PageResponse<any>>(
    this.url('projects'),
    this.options({ page, size })
  );
}

  /** Get project by ID */
  getById(id: number): Observable<any> {
    return this.http.get<any>(this.url(`projects/${id}`), this.options());
  }

  /** Create a new project */
  create(project: any): Observable<any> {
    return this.http.post<any>(this.url('projects'), project, this.options());
  }

  /** Update a project */
  update(id: number, project: any): Observable<any> {
    return this.http.put<any>(this.url(`projects/${id}`), project, this.options());
  }

  /** Delete a project */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`projects/${id}`), this.options());
  }
}
