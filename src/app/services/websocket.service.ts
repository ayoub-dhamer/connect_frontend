// websocket.service.ts
import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';

// ✅ Import the Client constructor only — avoid type imports from @stomp/stompjs
import { Client } from '@stomp/stompjs';
import { environment } from 'src/environments/environment';

// websocket.service.ts
export interface ChatMessage {
  id?: number;
  senderEmail: string;
  receiverEmail: string;
  content: string;
  timestamp?: string;
}

export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  roomId: string;
  sender: string;
  payload?: any;
}

export interface CallInvite {
  type: 'video' | 'audio';
  roomId: string;
  callerEmail: string;
  callerName: string;
  receiverEmail: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  // ✅ Everything from @stomp/stompjs typed as any
  private client: any;

  private messagesSubject = new BehaviorSubject<ChatMessage | null>(null);
  public messages$ = this.messagesSubject.asObservable();

  private signalingSubject = new Subject<SignalMessage>();
  public signals$ = this.signalingSubject.asObservable();

  private chatSubscription: any;
  private signalingSubscriptions = new Map<string, any>();

  private readonly WS_URL = environment.wsUrl;

  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  private callInviteSubject = new Subject<CallInvite>();
  public callInvite$ = this.callInviteSubject.asObservable();

  private callInviteSubscription: any;

  connect(): void {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.WS_URL),
      reconnectDelay: 5000,
      debug: (str: string) => console.log('[STOMP]', str),
    });

    this.client.onConnect = () => {
      console.log('✅ STOMP connected');
      this.subscribeToChat();
      this.subscribeToCallInvites();
      this.connectedSubject.next(true); // ← add this
    };

    this.client.onStompError = (frame: any) => {
      console.error('❌ STOMP error:', frame.headers['message']);
    };

    this.client.onWebSocketClose = () => {
      this.connectedSubject.next(false); // ← add this
    };

    this.client.activate();
  }

  private subscribeToCallInvites(): void {
    this.callInviteSubscription = this.client.subscribe(
      '/user/queue/call-invite',
      (message: any) => {
        if (message.body) {
          const invite: CallInvite = JSON.parse(message.body);
          this.callInviteSubject.next(invite);
        }
      },
    );
  }

  sendCallInvite(invite: CallInvite): void {
    if (!this.client?.active) {
      console.warn('Cannot send call invite — STOMP not connected');
      return;
    }
    this.client.publish({
      destination: '/app/call/invite',
      body: JSON.stringify(invite),
    });
  }

  disconnect(): void {
    this.chatSubscription?.unsubscribe();
    this.callInviteSubscription?.unsubscribe();
    this.signalingSubscriptions.forEach((sub) => sub.unsubscribe());
    this.signalingSubscriptions.clear();

    if (this.client?.active) {
      this.client.deactivate();
      console.log('🔌 STOMP disconnected');
    }
  }

  private subscribeToChat(): void {
    this.chatSubscription = this.client.subscribe(
      '/user/queue/messages',
      (message: any) => {
        if (message.body) {
          const chatMsg: ChatMessage = JSON.parse(message.body);
          this.messagesSubject.next(chatMsg);
        }
      },
    );
  }

  sendChatMessage(message: ChatMessage): void {
    if (!this.client?.active) {
      console.warn('Cannot send — STOMP not connected');
      return;
    }
    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify(message),
    });
  }

  subscribeToRoom(roomId: string): void {
    if (!this.client?.active) {
      console.warn('Cannot subscribe — STOMP not connected');
      return;
    }

    if (this.signalingSubscriptions.has(roomId)) return;

    const sub = this.client.subscribe(
      `/topic/room.${roomId}`,
      (message: any) => {
        if (message.body) {
          const signal: SignalMessage = JSON.parse(message.body);
          this.signalingSubject.next(signal);
        }
      },
    );

    this.signalingSubscriptions.set(roomId, sub);
  }

  unsubscribeFromRoom(roomId: string): void {
    this.signalingSubscriptions.get(roomId)?.unsubscribe();
    this.signalingSubscriptions.delete(roomId);
  }

  sendSignalMessage(roomId: string, message: SignalMessage): void {
    if (!this.client?.active) {
      console.warn('Cannot send signal — STOMP not connected');
      return;
    }
    this.client.publish({
      destination: `/app/room/${roomId}`,
      body: JSON.stringify(message),
    });
  }
}
