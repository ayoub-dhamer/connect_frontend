import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  sender: { email: string };
  receiver: { email: string };
  content: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  /*private client: Client;
  private messagesSubject = new BehaviorSubject<ChatMessage | null>(null);
  public messages$ = this.messagesSubject.asObservable();

  private currentUserEmail = '';

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP: ', str),
      onConnect: () => {
        console.log('✅ Connected to WebSocket');
        this.client.subscribe('/topic/messages', (message: IMessage) => {
          if (message.body) {
            const chatMessage: ChatMessage = JSON.parse(message.body);
            this.messagesSubject.next(chatMessage);
          }
        });
      },
      onStompError: (frame) => {
        console.error('❌ Broker error: ' + frame.headers['message']);
        console.error('❌ Details: ' + frame.body);
      }
    });
  }

  public connect(userEmail: string): void {
    this.currentUserEmail = userEmail;
    this.client.activate();
  }

  public disconnect(): void {
    this.client.deactivate();
  }

  public sendMessage(message: ChatMessage): void {
    message.timestamp = new Date().toISOString();
    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify(message)
    });
  }*/
}
