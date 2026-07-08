// chat.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class ChatService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getHistory(contactEmail: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      this.url(`chat/history/${contactEmail}`),
      this.options(),
    );
  }
}
