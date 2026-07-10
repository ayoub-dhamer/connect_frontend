// call.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CallLog {
  id: string;
  callerEmail: string;
  callerName: string;
  receiverEmail: string;
  receiverName: string;
  callType: 'VIDEO' | 'AUDIO';
  status: 'ACCEPTED' | 'DECLINED' | 'MISSED';
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface LogCallRequest {
  callId: string;
  callerEmail: string;
  receiverEmail: string;
  callType: 'VIDEO' | 'AUDIO';
  status: 'ACCEPTED' | 'DECLINED' | 'MISSED';
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

@Injectable({ providedIn: 'root' })
export class CallService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  logCall(request: LogCallRequest): Observable<void> {
    return this.http.post<void>(this.url('calls'), request, this.options());
  }

  getHistory(contactEmail: string): Observable<CallLog[]> {
    return this.http.get<CallLog[]>(
      this.url(`calls/history/${contactEmail}`),
      this.options(),
    );
  }
}
