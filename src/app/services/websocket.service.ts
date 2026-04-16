// websocket.service.ts
import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';

// ✅ Single source of truth for these interfaces
export interface ChatMessage {
  sender: { email: string };
  receiver: { email: string };
  content: string;
  timestamp?: string;
}

export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  roomId: string;
  sender: string;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client!: Client;

  // Chat stream
  private messagesSubject = new BehaviorSubject<ChatMessage | null>(null);
  public messages$ = this.messagesSubject.asObservable();

  // Signaling stream
  private signalingSubject = new Subject<SignalMessage>();
  public signals$ = this.signalingSubject.asObservable();

  private chatSubscription?: StompSubscription;
  private signalingSubscriptions = new Map<string, StompSubscription>();

  private readonly WS_URL = 'http://localhost:8080/ws';

  // -------------------------
  // Connection
  // -------------------------
  connect(): void {
    if (this.client?.active) return; // ✅ prevent double connection

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.WS_URL),
      reconnectDelay: 5000,
      debug: (str: any) => console.log('[STOMP]', str),
    });

    this.client.onConnect = () => {
      console.log('✅ STOMP connected');
      this.subscribeToChat();
    };

    this.client.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame.headers['message']);
    };

    this.client.activate();
  }

  disconnect(): void {
    this.chatSubscription?.unsubscribe();
    this.signalingSubscriptions.forEach(sub => sub.unsubscribe());
    this.signalingSubscriptions.clear();

    if (this.client?.active) {
      this.client.deactivate();
      console.log('🔌 STOMP disconnected');
    }
  }

  // -------------------------
  // Chat
  // -------------------------
  private subscribeToChat(): void {
    // ✅ Correct destination — user-specific queue, not broadcast topic
    this.chatSubscription = this.client.subscribe(
      '/user/queue/messages',
      (message: IMessage) => {
        if (message.body) {
          const chatMsg: ChatMessage = JSON.parse(message.body);
          this.messagesSubject.next(chatMsg);
        }
      }
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

  // -------------------------
  // WebRTC Signaling
  // -------------------------
  subscribeToRoom(roomId: string): void {
    if (!this.client?.active) {
      console.warn('Cannot subscribe — STOMP not connected');
      return;
    }

    if (this.signalingSubscriptions.has(roomId)) return; // ✅ no duplicate subs

    const sub = this.client.subscribe(
      `/topic/room.${roomId}`,
      (message: IMessage) => {
        if (message.body) {
          const signal: SignalMessage = JSON.parse(message.body);
          this.signalingSubject.next(signal);
        }
      }
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