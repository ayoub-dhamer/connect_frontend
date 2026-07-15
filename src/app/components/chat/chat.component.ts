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
  GroupCallSignal,
} from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { CallService, CallLog } from '../../services/call.service';
import {
  ConversationService,
  TimelineItem,
} from '../../services/conversation.service';
import { ToastMessageService } from 'src/app/services/toast-message.service';
import { Group, GroupService } from 'src/app/services/group.service';
import { GroupCreateComponent } from '../../components/group-create/group-create.component';

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

  //incomingCall: CallSignal | null = null;
  //outgoingCall: CallSignal | null = null;

  //incomingGroupCall: GroupCallSignal | null = null;
  //outgoingGroupCall: GroupCallSignal | null = null;

  private sub!: Subscription;
  private callSub!: Subscription;
  private groupCallSub!: Subscription;

  private outgoingCallTimeout: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  private ringtoneAudio: HTMLAudioElement | null = null;

  private inCall = false;

  private readonly tabId = crypto.randomUUID();

  private readonly OUTGOING_LOCK_KEY = 'outgoing-call-lock';
  private readonly OUTGOING_LOCK_TTL_MS = 45000; // slightly longer than the 30s ring timeout

  groups: Group[] = [];
  selectedGroup: Group | null = null;
  groupCreateOpen = false;

  private groupChatSub: Subscription | null = null;

  constructor(
    private ws: WebSocketService,
    private auth: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    private callService: CallService,
    private router: Router,
    private route: ActivatedRoute,
    private conversationService: ConversationService,
    private toast: ToastMessageService,
    private groupService: GroupService,
  ) {}

  ngOnInit(): void {
    this.inCall = false;

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

    this.groupCallSub = this.ws.groupCallSignal$.subscribe((signal) =>
      this.handleGroupCallSignal(signal),
    );

    this.groupService
      .getMyGroups()
      .subscribe((groups) => (this.groups = groups));

    window.addEventListener('beforeunload', this.handleUnload);
  }

  private handleGroupCallSignal(signal: GroupCallSignal): void {
    switch (signal.type) {
      case 'invite':
        if (
          this.inCall ||
          this.outgoingCall ||
          this.incomingCall ||
          this.outgoingGroupCall ||
          this.incomingGroupCall
        ) {
          this.ws.sendGroupCallSignal({
            ...signal,
            type: 'decline',
            respondentEmail: this.currentUserEmail,
          });
          return;
        }
        if (!this.claimCall(signal.callId)) return;
        this.incomingGroupCall = signal;
        this.startRingtone();
        break;

      case 'accept':
        if (this.outgoingGroupCall?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          const call = this.outgoingGroupCall;
          this.outgoingGroupCall = null;
          this.playCallAcceptedTone();
          this.navigateToGroupRoom(call);
        } else {
          this.toast.info(`${signal.respondentEmail} joined the call`);
        }
        break;

      case 'decline':
        if (this.outgoingGroupCall?.callId === signal.callId) {
          this.toast.info(`${signal.respondentEmail} declined`);
        }
        break;

      case 'all-declined':
        if (this.outgoingGroupCall?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          this.outgoingGroupCall = null;
          this.toast.info('Everyone declined the call');
        }
        break;

      case 'cancel':
        if (this.incomingGroupCall?.callId === signal.callId) {
          this.stopRingtone();
          this.releaseClaim(signal.callId);
          this.incomingGroupCall = null;
        }
        break;
    }
  }

  getGroupSenderName(email: string): string {
    const member = this.selectedGroup?.members.find((m) => m.email === email);
    return member?.name ?? email;
  }

  openGroupCreate(): void {
    this.groupCreateOpen = true;
  }

  onGroupCreated(group: Group | null): void {
    this.groupCreateOpen = false;
    if (group) {
      this.groups.push(group);
      this.selectGroup(group);
    }
  }

  selectGroup(group: Group): void {
    this.selectedUser = null;
    this.selectedGroup = group;
    this.timeline = [];

    this.groupChatSub?.unsubscribe();
    this.groupChatSub = this.ws
      .subscribeToGroupChat(group.id)
      .subscribe((msg) => {
        this.timeline.push({
          kind: 'message',
          timestamp: msg.timestamp,
          message: {
            senderEmail: msg.senderEmail,
            receiverEmail: '',
            content: msg.content,
            timestamp: msg.timestamp,
          } as any,
          call: null,
        });
        this.timeline.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        this.scrollToBottom();
      });

    this.groupService.getHistory(group.id).subscribe((messages) => {
      const msgItems = messages.map((m) => ({
        kind: 'message' as const,
        timestamp: m.timestamp,
        message: {
          senderEmail: m.senderEmail,
          receiverEmail: '',
          content: m.content,
          timestamp: m.timestamp,
        } as any,
        call: null,
      }));

      this.groupService.getCallHistory(group.id).subscribe((calls) => {
        const callItems = calls.map((c) => ({
          kind: 'group-call' as const,
          timestamp: c.startedAt,
          message: null,
          call: null,
          groupCall: c,
        }));

        this.timeline = [...msgItems, ...callItems].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        this.scrollToBottom();
      });
    });
  }

  sendGroupMessage(): void {
    if (!this.newMessage.trim() || !this.selectedGroup) return;
    this.ws.sendGroupMessage(
      this.selectedGroup.id,
      this.currentUserEmail,
      this.newMessage.trim(),
    );
    this.newMessage = '';
  }

  startGroupCall(type: 'video' | 'audio'): void {
    if (
      !this.selectedGroup ||
      this.inCall ||
      this.outgoingCall ||
      this.incomingCall ||
      this.outgoingGroupCall ||
      this.incomingGroupCall
    )
      return;
    if (!this.claimOutgoing()) {
      this.toast.info('You already have a call in progress in another tab');
      return;
    }

    const callId = crypto.randomUUID();
    const roomId = `group-${this.selectedGroup.id}-${callId}`;

    const invite: GroupCallSignal = {
      type: 'invite',
      callId,
      roomId,
      callType: type,
      callerEmail: this.currentUserEmail,
      callerName: this.currentUserName,
      groupId: this.selectedGroup.id,
      groupName: this.selectedGroup.name,
    };

    this.outgoingGroupCall = invite;
    this.ws.sendGroupCallSignal(invite);
    this.startRingtone();

    this.outgoingCallTimeout = setTimeout(() => {
      if (this.outgoingGroupCall?.callId === callId)
        this.cancelOutgoingGroupCall();
    }, 30000);
  }

  cancelOutgoingGroupCall(): void {
    if (!this.outgoingGroupCall) return;
    const call = this.outgoingGroupCall;

    this.clearOutgoingTimeout();
    this.stopRingtone();
    this.releaseOutgoing();

    this.ws.sendGroupCallSignal({ ...call, type: 'cancel' });
    this.outgoingGroupCall = null;
  }

  acceptGroupCall(): void {
    if (!this.incomingGroupCall) return;
    const call = this.incomingGroupCall;
    this.incomingGroupCall = null;
    this.stopRingtone();
    this.releaseClaim(call.callId);

    this.ws.sendGroupCallSignal({
      ...call,
      type: 'accept',
      respondentEmail: this.currentUserEmail,
    });
    this.playCallAcceptedTone();
    this.navigateToGroupRoom(call);
  }

  declineGroupCall(): void {
    if (!this.incomingGroupCall) return;
    const call = this.incomingGroupCall;
    this.incomingGroupCall = null;
    this.stopRingtone();
    this.releaseClaim(call.callId);

    this.ws.sendGroupCallSignal({
      ...call,
      type: 'decline',
      respondentEmail: this.currentUserEmail,
    });
  }

  private navigateToGroupRoom(call: GroupCallSignal): void {
    this.inCall = true;
    this.router.navigate(['/user/video', call.roomId], {
      queryParams: {
        type: call.callType,
        callId: call.callId,
        groupId: call.groupId,
        groupName: call.groupName,
        isGroup: true,
      },
    });
  }

  private handleUnload = (): void => {
    if (this.outgoingCall) {
      this.ws.sendCallSignal({
        ...this.outgoingCall,
        type: 'cancel',
        receiverEmail: this.outgoingCall.receiverEmail,
      });
    }
    if (this.incomingCall) {
      this.ws.sendCallSignal({
        ...this.incomingCall,
        type: 'decline',
        receiverEmail: this.incomingCall.callerEmail,
      });
    }
  };

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
        if (this.inCall || this.outgoingCall || this.incomingCall) {
          this.ws.sendCallSignal({
            ...signal,
            type: 'decline',
            receiverEmail: signal.callerEmail,
          });
          return;
        }
        if (!this.claimCall(signal.callId)) return;
        this.incomingCall = signal;
        this.startRingtone();
        break;

      case 'accept':
        if (this.outgoingCall?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          const call = this.outgoingCall;
          this.outgoingCall = null;
          this.playCallAcceptedTone();
          this.navigateToRoom(call, call.receiverEmail);
        }
        break;
      case 'decline':
        if (this.outgoingCall?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          const call = this.outgoingCall;
          this.outgoingCall = null;
          this.pushLocalCallEntry(
            call,
            'DECLINED',
            signal.startedAt ?? new Date().toISOString(),
          );
        }
        break;
      case 'busy':
        if (this.outgoingCall?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          const call = this.outgoingCall;
          this.outgoingCall = null;
          this.pushLocalCallEntry(
            call,
            'MISSED',
            signal.startedAt ?? new Date().toISOString(),
          );
          this.toast.info(
            `${this.selectedUser?.name ?? 'They'} are on another call`,
          );
        }
        break;
      case 'cancel':
        if (this.incomingCall?.callId === signal.callId) {
          this.stopRingtone();
          this.releaseClaim(signal.callId);
          const call = this.incomingCall;
          this.incomingCall = null;
          this.pushLocalCallEntry(
            call,
            'MISSED',
            signal.startedAt ?? new Date().toISOString(),
          );
        }
        break;
    }
  }

  private claimCall(callId: string): boolean {
    const key = `call-claim-${callId}`;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, this.tabId);
    return true;
  }

  private releaseClaim(callId: string): void {
    localStorage.removeItem(`call-claim-${callId}`);
  }

  private navigateToRoom(call: CallSignal, otherEmail: string): void {
    this.inCall = true;
    this.router.navigate(['/user/video', call.roomId], {
      queryParams: {
        type: call.callType,
        callId: call.callId,
        callerEmail: call.callerEmail,
        receiverEmail: call.receiverEmail,
        otherEmail,
        isGroup: false,
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
    if (this.selectedGroup) {
      this.sendGroupMessage();
      return;
    }
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
    if (
      !this.selectedUser ||
      this.inCall ||
      this.outgoingCall ||
      this.incomingCall
    )
      return;
    if (!this.claimOutgoing()) {
      this.toast.info('You already have a call in progress in another tab');
      return;
    }

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
    this.startRingtone();

    this.outgoingCallTimeout = setTimeout(() => {
      if (this.outgoingCall?.callId === callId) this.cancelOutgoingCall();
    }, 30000);
  }

  private claimOutgoing(): boolean {
    const existing = localStorage.getItem(this.OUTGOING_LOCK_KEY);
    if (existing) {
      const { timestamp } = JSON.parse(existing);
      if (Date.now() - timestamp < this.OUTGOING_LOCK_TTL_MS) {
        return false; // another tab already has an active outgoing call
      }
      // stale lock (older tab crashed/closed without releasing) — reclaim it
    }
    localStorage.setItem(
      this.OUTGOING_LOCK_KEY,
      JSON.stringify({ tabId: this.tabId, timestamp: Date.now() }),
    );
    return true;
  }

  private releaseOutgoing(): void {
    const existing = localStorage.getItem(this.OUTGOING_LOCK_KEY);
    if (existing) {
      const { tabId } = JSON.parse(existing);
      if (tabId === this.tabId) {
        localStorage.removeItem(this.OUTGOING_LOCK_KEY);
      }
    }
  }

  cancelOutgoingCall(): void {
    if (!this.outgoingCall) return;
    const call = this.outgoingCall;

    this.clearOutgoingTimeout();
    this.stopRingtone();
    this.releaseOutgoing();

    const startedAt = new Date().toISOString();
    this.ws.sendCallSignal({
      ...call,
      type: 'cancel',
      receiverEmail: call.receiverEmail,
      startedAt,
    });
    this.outgoingCall = null;

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
    this.stopRingtone();
    this.releaseClaim(call.callId);

    this.ws.sendCallSignal({
      ...call,
      type: 'accept',
      receiverEmail: call.callerEmail,
    });
    this.playCallAcceptedTone();
    this.navigateToRoom(call, call.callerEmail);
  }

  private playCallAcceptedTone(): void {
    const audio = new Audio('assets/sounds/call-accepted.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Non-critical if blocked — skip silently.
    });
  }

  declineCall(): void {
    if (!this.incomingCall) return;
    const call = this.incomingCall;
    this.incomingCall = null;
    this.stopRingtone();
    this.releaseClaim(call.callId);

    const startedAt = new Date().toISOString();
    this.ws.sendCallSignal({
      ...call,
      type: 'decline',
      receiverEmail: call.callerEmail,
      startedAt,
    });
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

  private startRingtone(): void {
    this.stopRingtone(); // guard against double-start
    this.ringtoneAudio = new Audio('assets/sounds/ringtone.mp3');
    this.ringtoneAudio.loop = true;
    this.ringtoneAudio.volume = 0.6;
    this.ringtoneAudio.play().catch(() => {
      // Autoplay may be blocked if this fires with no prior gesture on the page —
      // non-critical, the visual modal still shows either way.
    });
  }

  private stopRingtone(): void {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
      this.ringtoneAudio = null;
    }
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
    window.removeEventListener('beforeunload', this.handleUnload);

    this.sub?.unsubscribe();
    this.callSub?.unsubscribe();
    this.groupCallSub?.unsubscribe();
    this.clearOutgoingTimeout();
    this.stopRingtone();
  }
}
