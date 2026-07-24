import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, of } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CallStatus {
  inCall: boolean;
  callType: 'one_to_one' | 'group' | null;
  callId: string | null;
}

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly POLL_INTERVAL_MS = 8000;

  constructor(private http: HttpClient) {}

  getCallStatus(emails: string[]): Observable<Record<string, CallStatus>> {
    if (emails.length === 0) return of({});
    return this.http.post<Record<string, CallStatus>>(
      `${environment.apiUrl}/presence/call-status`,
      { emails },
      { withCredentials: true },
    );
  }

  /** Polls call status for the given emails every N seconds. */
  watchCallStatus(
    emails: () => string[],
  ): Observable<Record<string, CallStatus>> {
    return interval(this.POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.getCallStatus(emails())),
    );
  }
}
