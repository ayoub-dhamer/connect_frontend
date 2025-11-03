import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  protected url(path: string) {
    return `${this.baseUrl}/${path}`;
  }
}
