import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  /** Build full API URL */
  protected url(path: string): string {
    return `${this.baseUrl}/${path}`;
  }

  /** Default request options (cookies enabled) */
  protected options(params?: any) {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return {
      withCredentials: true, // IMPORTANT for HttpOnly cookie auth
      params: httpParams
    };
  }
}
