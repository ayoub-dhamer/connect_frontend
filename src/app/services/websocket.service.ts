// websocket.service.ts
import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

// ✅ Import the Client constructor only — avoid type imports from @stomp/stompjs
import { Client } from '@stomp/stompjs';
import { environment } from 'src/environments/environment';
import { GroupMessage } from './group.service';

// websocket.service.ts
export interface ChatMessage {
  id?: number;
  senderEmail: string;
  receiverEmail: string;
  content: string;
  timestamp?: string;
}

export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave' | 'status' | 'chat';
  roomId: string;
  sender: string;
  payload?: any;
  micOn?: boolean;
  camOn?: boolean;
  text?: string;
}

export interface CallInvite {
  type: 'video' | 'audio';
  roomId: string;
  callerEmail: string;
  callerName: string;
  receiverEmail: string;
}

export type CallSignalType =
  | 'invite'
  | 'accept'
  | 'decline'
  | 'cancel'
  | 'busy'
  | 'ended';

export interface CallSignal {
  type: CallSignalType;
  callId: string;
  roomId: string;
  callType: 'video' | 'audio';
  callerEmail: string;
  callerName: string;
  receiverEmail: string;
  startedAt?: string;
}

export type GroupCallSignalType =
  | 'invite'
  | 'accept'
  | 'decline'
  | 'cancel'
  | 'ended'
  | 'all-declined';

export interface GroupCallSignal {
  type: GroupCallSignalType;
  callId: string;
  roomId: string;
  callType: 'video' | 'audio';
  callerEmail: string;
  callerName: string;
  groupId: number;
  groupName: string;
  respondentEmail?: string;
  startedAt?: string;
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

  private callSignalSubject = new Subject<CallSignal>();
  public callSignal$ = this.callSignalSubject.asObservable();
  private callSignalSubscription: any;

  private groupCallSignalSubject = new Subject<GroupCallSignal>();
  public groupCallSignal$ = this.groupCallSignalSubject.asObservable();
  private groupCallSignalSubscription: any;

  private groupMessageSubjects = new Map<number, Subject<GroupMessage>>();
  private groupSubscriptions = new Map<number, any>();

  subscribeToGroupChat(groupId: number): Observable<GroupMessage> {
    if (!this.groupMessageSubjects.has(groupId)) {
      this.groupMessageSubjects.set(groupId, new Subject<GroupMessage>());
    }

    if (this.client?.active && !this.groupSubscriptions.has(groupId)) {
      const sub = this.client.subscribe(
        `/topic/group.${groupId}`,
        (message: any) => {
          if (message.body) {
            this.groupMessageSubjects
              .get(groupId)!
              .next(JSON.parse(message.body));
          }
        },
      );
      this.groupSubscriptions.set(groupId, sub);
    }

    return this.groupMessageSubjects.get(groupId)!.asObservable();
  }

  unsubscribeFromGroupChat(groupId: number): void {
    this.groupSubscriptions.get(groupId)?.unsubscribe();
    this.groupSubscriptions.delete(groupId);
  }

  sendGroupMessage(
    groupId: number,
    senderEmail: string,
    content: string,
  ): void {
    if (!this.client?.active) return;
    this.client.publish({
      destination: `/app/group-chat/${groupId}`,
      body: JSON.stringify({ senderEmail, content }),
    });
  }

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
      this.subscribeToCallSignals();
      this.subscribeToGroupCallSignals(); // add
      this.connectedSubject.next(true);
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

  private subscribeToCallSignals(): void {
    this.callSignalSubscription = this.client.subscribe(
      '/user/queue/call-signal',
      (message: any) => {
        if (message.body) this.callSignalSubject.next(JSON.parse(message.body));
      },
    );
  }

  private subscribeToGroupCallSignals(): void {
    this.groupCallSignalSubscription = this.client.subscribe(
      '/user/queue/group-call-signal',
      (message: any) => {
        if (message.body)
          this.groupCallSignalSubject.next(JSON.parse(message.body));
      },
    );
  }

  sendCallSignal(signal: CallSignal): void {
    if (!this.client?.active) return;
    this.client.publish({
      destination: '/app/call/signal',
      body: JSON.stringify(signal),
    });
  }

  sendGroupCallSignal(signal: GroupCallSignal): void {
    if (!this.client?.active) return;
    this.client.publish({
      destination: '/app/group-call/signal',
      body: JSON.stringify(signal),
    });
  }

  disconnect(): void {
    this.chatSubscription?.unsubscribe();
    this.callSignalSubscription?.unsubscribe();
    this.groupCallSignalSubscription?.unsubscribe(); // add
    this.signalingSubscriptions.forEach((sub) => sub.unsubscribe());
    this.signalingSubscriptions.clear();
    if (this.client?.active) {
      this.client.deactivate();
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

    this.signalingSubscriptions.get(roomId)?.unsubscribe();
    this.signalingSubscriptions.delete(roomId);

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
