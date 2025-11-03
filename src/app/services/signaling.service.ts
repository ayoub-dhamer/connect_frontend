import { Injectable } from '@angular/core';
/*import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  roomId: string;
  sender: string;
  payload?: any; // sdp or candidate
}*/

@Injectable({
  providedIn: 'root'
})
export class SignalingService {
  /*private client!: Client;
  private connected = false;
  private messageSubject = new Subject<SignalMessage>();
  messages$ = this.messageSubject.asObservable();
  private subscription?: StompSubscription;

  connect(): void {
    if (this.connected) return;

    this.client = new Client({
      // webSocketFactory returns SockJS instance — this avoids browser compatibility issues
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      debug: (str) => {
        console.log('STOMP: ' + str);
      }
    });

    this.client.onConnect = () => {
      console.log('STOMP connected');
      this.connected = true;
      // We'll not subscribe here to a fixed topic; Video component will subscribe per room
    };

    this.client.onStompError = (frame) => {
      console.error('Broker error: ' + frame.headers['message']);
    };

    this.client.activate();
  }

  // Subscribe to a room topic, returns subscription (component can unsubscribe)
  subscribeToRoom(roomId: string): void {
    if (!this.client || !this.client.connected) {
      console.warn('STOMP not connected yet. Connecting...');
      this.connect();
      // subscribe when onConnect fires — but to keep simple, try again later
      setTimeout(() => this.subscribeToRoom(roomId), 500);
      return;
    }

    // Unsubscribe previous if exists
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = this.client.subscribe(`/topic/room.${roomId}`, (msg: IMessage) => {
      if (msg.body) {
        const parsed: SignalMessage = JSON.parse(msg.body);
        this.messageSubject.next(parsed);
      }
    });
  }

  sendToRoom(roomId: string, message: SignalMessage): void {
    if (!this.client || !this.client.connected) {
      console.error('STOMP client not connected');
      return;
    }
    this.client.publish({
      destination: `/app/room/${roomId}`,
      body: JSON.stringify(message)
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }*/
}
