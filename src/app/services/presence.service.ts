import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, filter, take } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { environment } from 'src/environments/environment';

export interface CallStatus {
  inCall: boolean;
  callType: 'one_to_one' | 'group' | null;
  callId: string | null;
}

export interface PresenceEvent {
  email: string;
  inCall: boolean;
  callType: 'one_to_one' | 'group' | null;
  callId: string | null;
}

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private statuses$ = new BehaviorSubject<Record<string, CallStatus>>({});
  public presence$ = this.statuses$.asObservable();

  private subscribed = false;

  constructor(
    private ws: WebSocketService,
    private http: HttpClient,
  ) {}

  /** Call once — subscribes to the shared presence topic and keeps a live
   *  map of email -> call status updated in real time. */
  init(): void {
    if (this.subscribed) return;
    this.subscribed = true;

    this.ws.connected$
      .pipe(
        filter((c) => c),
        take(1),
      )
      .subscribe(() => {
        this.ws
          .subscribeToPresence()
          .subscribe((event) => this.applyEvent(event));
      });
  }

  private applyEvent(event: PresenceEvent): void {
    const current = { ...this.statuses$.value };
    // Only ever touches the exact email in the event — never bulk-clears.
    current[event.email] = {
      inCall: event.inCall,
      callType: event.callType,
      callId: event.callId,
    };
    this.statuses$.next(current);
  }

  getSnapshot(): Record<string, CallStatus> {
    return this.statuses$.value;
  }

  /** One-time REST bootstrap — covers calls already in progress before this
   *  page/session loaded, before live events start updating the map. */
  getCallStatus(emails: string[]): Observable<Record<string, CallStatus>> {
    if (emails.length === 0) return new BehaviorSubject({}).asObservable();
    return this.http.post<Record<string, CallStatus>>(
      `${environment.apiUrl}/presence/call-status`,
      { emails },
      { withCredentials: true },
    );
  }
}
