// conversation.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage } from './websocket.service';
import { CallLog } from './call.service';
import { GroupCallSession } from './group.service';

export interface TimelineItem {
  kind: 'message' | 'call' | 'group-call';
  timestamp: string;
  message: ChatMessage | null;
  call: CallLog | null;
  groupCall?: GroupCallSession | null;
}

@Injectable({ providedIn: 'root' })
export class ConversationService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getTimeline(contactEmail: string): Observable<TimelineItem[]> {
    return this.http.get<TimelineItem[]>(
      this.url(`conversation/${contactEmail}`),
      this.options(),
    );
  }
}
