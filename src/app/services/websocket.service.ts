import { Injectable } from '@angular/core';
import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

export interface ChatMessage {
  id?: number;
  content: string;
  senderEmail: string;
  receiverEmail: string;
  timestamp?: string;
}

export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  roomId: string;
  sender: string;
  payload: any; 
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private client!: Client; 
  private chatSubscription?: StompSubscription;
  private signalingSubscriptions: Map<string, StompSubscription> = new Map();

  private readonly WS_URL = 'http://localhost:8080/ws'; // Backend endpoint

  constructor() {}

  // -------------------------
  // Connect to STOMP WebSocket
  // -------------------------
  connect(onMessage: (msg: ChatMessage) => void): void {
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.WS_URL),
      reconnectDelay: 5000,
      debug: (str: any) => console.log('[STOMP]', str),
    });

    this.client.onConnect = () => {
      console.log('STOMP connected');

      // Subscribe to user messages
      this.chatSubscription = this.client.subscribe('/user/queue/messages', (message: any) => {
        const chatMsg: ChatMessage = JSON.parse(message.body);
        onMessage(chatMsg);
      });
    };

    this.client.activate();
  }

  disconnect(): void {
    this.chatSubscription?.unsubscribe();
    this.signalingSubscriptions.forEach((sub) => sub.unsubscribe());
    this.signalingSubscriptions.clear();

    if (this.client && this.client.active) {
      this.client.deactivate();
      console.log('STOMP disconnected');
    }
  }

  // -------------------------
  // Chat
  // -------------------------
  sendChatMessage(message: ChatMessage): void {
    if (!this.client || !this.client.active) return;

    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify(message),
    });
  }

  // -------------------------
  // WebRTC Signaling
  // -------------------------
  subscribeToRoom(roomId: string, onSignal: (msg: SignalMessage) => void): void {
    if (!this.client || !this.client.active) return;

    const destination = `/topic/room.${roomId}`;
    if (this.signalingSubscriptions.has(roomId)) return;

    const sub = this.client.subscribe(destination, (message: any) => {
      const signalMsg: SignalMessage = JSON.parse(message.body);
      onSignal(signalMsg);
    });

    this.signalingSubscriptions.set(roomId, sub);
  }

  unsubscribeFromRoom(roomId: string): void {
    const sub = this.signalingSubscriptions.get(roomId);
    sub?.unsubscribe();
    this.signalingSubscriptions.delete(roomId);
  }

  sendSignalMessage(roomId: string, message: SignalMessage): void {
    if (!this.client || !this.client.active) return;

    this.client.publish({
      destination: `/app/room/${roomId}`,
      body: JSON.stringify(message),
    });
  }
}