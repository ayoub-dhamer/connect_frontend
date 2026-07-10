import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  WebSocketService,
  ChatMessage,
  CallSignal,
} from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { CallService, CallLog } from '../../services/call.service';
import {
  ConversationService,
  TimelineItem,
} from '../../services/conversation.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  users: any[] = [];
  selectedUser: any = null;
  timeline: TimelineItem[] = [];
  newMessage = '';
  currentUserEmail = '';
  currentUserName = '';

  incomingCall: CallSignal | null = null;
  outgoingCall: CallSignal | null = null;

  private sub!: Subscription;
  private callSub!: Subscription;

  private outgoingCallTimeout: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  constructor(
    private ws: WebSocketService,
    private auth: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    private callService: CallService,
    private router: Router,
    private route: ActivatedRoute,
    private conversationService: ConversationService,
  ) {}

  ngOnInit(): void {
    this.auth.loadUser().subscribe((user) => {
      if (user) {
        this.currentUserEmail = user.email;
        this.currentUserName = user.name;
      }
    });

    this.userService.getAll().subscribe((res: any) => {
      const all = res.content ?? res;
      this.auth.loadUser().subscribe((me) => {
        this.users = all.filter((u: any) => u.email !== me?.email);
        this.restoreSelectedUserFromQueryParams();
      });
    });

    this.ws.connect();

    this.sub = this.ws.messages$.subscribe((msg) => {
      if (msg && this.selectedUser && this.isForCurrentConversation(msg)) {
        this.timeline.push({
          kind: 'message',
          timestamp: msg.timestamp!,
          message: msg,
          call: null,
        });
        this.scrollToBottom();
      }
    });

    this.callSub = this.ws.callSignal$.subscribe((signal) => {
      this.handleCallSignal(signal);
    });
  }

  private isForCurrentConversation(msg: ChatMessage): boolean {
    return (
      (msg.senderEmail === this.currentUserEmail &&
        msg.receiverEmail === this.selectedUser.email) ||
      (msg.senderEmail === this.selectedUser.email &&
        msg.receiverEmail === this.currentUserEmail)
    );
  }

  private restoreSelectedUserFromQueryParams(): void {
    const withEmail = this.route.snapshot.queryParamMap.get('with');
    if (withEmail) {
      const user = this.users.find((u) => u.email === withEmail);
      if (user) this.selectUser(user);
    }
  }

  private handleCallSignal(signal: CallSignal): void {
    switch (signal.type) {
      case 'invite':
        this.incomingCall = signal;
        break;

      case 'accept':
        if (this.outgoingCall?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          const call = this.outgoingCall;
          this.outgoingCall = null;
          this.navigateToRoom(call, call.receiverEmail);
        }
        break;

      case 'decline':
        if (this.outgoingCall?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.outgoingCall = null;
        }
        break;

      case 'cancel':
        if (this.incomingCall?.callId === signal.callId) {
          this.incomingCall = null;
        }
        break;
    }
  }

  private navigateToRoom(call: CallSignal, otherEmail: string): void {
    this.router.navigate(['/user/video', call.roomId], {
      queryParams: {
        type: call.callType,
        callId: call.callId,
        callerEmail: call.callerEmail,
        receiverEmail: call.receiverEmail,
        otherEmail,
      },
    });
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.timeline = [];

    this.conversationService.getTimeline(user.email).subscribe({
      next: (items) => {
        this.timeline = items;
        this.scrollToBottom();
      },
      error: (err) => console.error('Failed to load conversation:', err),
    });
  }

  /*private mergeMessages(messages: ChatMessage[]): void {
    const items: TimelineItem[] = messages.map((m) => ({
      kind: 'message',
      data: m,
      time: new Date(m.timestamp!).getTime(),
    }));
    this.timeline = [...this.timeline, ...items].sort(
      (a, b) => a.time - b.time,
    );
    this.scrollToBottom();
  }

  private mergeCalls(calls: CallLog[]): void {
    const items: TimelineItem[] = calls.map((c) => ({
      kind: 'call',
      data: c,
      time: new Date(c.startedAt).getTime(),
    }));
    this.timeline = [...this.timeline, ...items].sort(
      (a, b) => a.time - b.time,
    );
    this.scrollToBottom();
  }*/

  send(): void {
    if (!this.newMessage.trim() || !this.selectedUser) return;

    const msg: ChatMessage = {
      senderEmail: this.currentUserEmail,
      receiverEmail: this.selectedUser.email,
      content: this.newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    this.ws.sendChatMessage(msg);
    this.timeline.push({
      kind: 'message',
      timestamp: msg.timestamp!,
      message: msg,
      call: null,
    });
    this.newMessage = '';
    this.scrollToBottom();
  }

  // ── Calling ─────────────────────────────────────────────

  startCall(type: 'video' | 'audio'): void {
    if (!this.selectedUser) return;

    const roomId = this.buildRoomId(
      this.currentUserEmail,
      this.selectedUser.email,
    );
    const callId = crypto.randomUUID();

    const invite: CallSignal = {
      type: 'invite',
      callId,
      roomId,
      callType: type,
      callerEmail: this.currentUserEmail,
      callerName: this.currentUserName,
      receiverEmail: this.selectedUser.email,
    };

    this.outgoingCall = invite;
    this.ws.sendCallSignal(invite);

    this.outgoingCallTimeout = setTimeout(() => {
      if (this.outgoingCall?.callId === callId) {
        this.cancelOutgoingCall();
      }
    }, 30000);
  }

  cancelOutgoingCall(): void {
    if (!this.outgoingCall) return;
    const call = this.outgoingCall;

    this.clearOutgoingTimeout();

    this.ws.sendCallSignal({
      ...call,
      type: 'cancel',
      receiverEmail: call.receiverEmail,
    });
    this.outgoingCall = null;

    const startedAt = new Date().toISOString();
    this.callService
      .logCall({
        callId: call.callId,
        callerEmail: call.callerEmail,
        receiverEmail: call.receiverEmail,
        callType: call.callType.toUpperCase() as 'VIDEO' | 'AUDIO',
        status: 'MISSED',
        startedAt,
      })
      .subscribe({
        next: () => this.pushLocalCallEntry(call, 'MISSED', startedAt),
        error: (err) => console.error('Failed to log call:', err),
      });
  }

  private clearOutgoingTimeout(): void {
    if (this.outgoingCallTimeout) {
      clearTimeout(this.outgoingCallTimeout);
      this.outgoingCallTimeout = null;
    }
  }

  acceptCall(): void {
    if (!this.incomingCall) return;
    const call = this.incomingCall;
    this.incomingCall = null;

    this.ws.sendCallSignal({
      ...call,
      type: 'accept',
      receiverEmail: call.callerEmail,
    });
    this.navigateToRoom(call, call.callerEmail);
  }

  declineCall(): void {
    if (!this.incomingCall) return;
    const call = this.incomingCall;
    this.incomingCall = null;

    this.ws.sendCallSignal({
      ...call,
      type: 'decline',
      receiverEmail: call.callerEmail,
    });

    const startedAt = new Date().toISOString();
    this.callService
      .logCall({
        callId: call.callId,
        callerEmail: call.callerEmail,
        receiverEmail: call.receiverEmail,
        callType: call.callType.toUpperCase() as 'VIDEO' | 'AUDIO',
        status: 'DECLINED',
        startedAt,
      })
      .subscribe({
        next: () => this.pushLocalCallEntry(call, 'DECLINED', startedAt),
        error: (err) => console.error('Failed to log call:', err),
      });
  }

  private pushLocalCallEntry(
    call: CallSignal,
    status: 'MISSED' | 'DECLINED',
    startedAt: string,
  ): void {
    if (!this.selectedUser) return;
    if (
      this.selectedUser.email !== call.callerEmail &&
      this.selectedUser.email !== call.receiverEmail
    )
      return;

    const entry: CallLog = {
      id: call.callId,
      callerEmail: call.callerEmail,
      callerName: call.callerName,
      receiverEmail: call.receiverEmail,
      receiverName: this.selectedUser.name,
      callType: call.callType.toUpperCase() as 'VIDEO' | 'AUDIO',
      status,
      startedAt,
    };
    this.timeline.push({
      kind: 'call',
      timestamp: startedAt,
      message: null,
      call: entry,
    });
    this.scrollToBottom();
  }

  private buildRoomId(a: string, b: string): string {
    return [a, b].sort().join('__').replace(/[@.]/g, '-');
  }

  // ── Helpers ─────────────────────────────────────────────

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        const el = this.messageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.callSub?.unsubscribe();
    this.clearOutgoingTimeout();
  }
}
