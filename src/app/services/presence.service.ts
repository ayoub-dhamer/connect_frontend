import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebSocketService } from './websocket.service';

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

  constructor(private ws: WebSocketService) {}

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
}
