import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectService extends ApiService {
  constructor(http: HttpClient) { super(http); }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url('projects'));
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(this.url(`projects/${id}`));
  }

  create(project: any): Observable<any> {
    return this.http.post<any>(this.url('projects'), project);
  }

  update(id: number, project: any): Observable<any> {
    return this.http.put<any>(this.url(`Anys/${id}`), project);
  }

  delete(id: number) {
    return this.http.delete<void>(this.url(`projects/${id}`));
  }
}
