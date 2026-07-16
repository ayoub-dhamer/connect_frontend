import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  WebSocketService,
  ChatMessage,
} from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { CallLog } from '../../services/call.service';
import {
  ConversationService,
  TimelineItem,
} from '../../services/conversation.service';
import { Group, GroupService } from '../../services/group.service';
import { CallSignalService } from '../../services/call-signal.service';

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

  groups: Group[] = [];
  selectedGroup: Group | null = null;
  groupCreateOpen = false;

  groupSettingsOpen = false;

  private sub!: Subscription;
  private groupChatSub: Subscription | null = null;
  private callLoggedSub!: Subscription;

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  constructor(
    private ws: WebSocketService,
    private auth: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private conversationService: ConversationService,
    private groupService: GroupService,
    public callSignal: CallSignalService,
  ) {}

  ngOnInit(): void {
    this.auth.loadUser().subscribe((user) => {
      if (user) {
        this.currentUserEmail = user.email;
        this.currentUserName = user.name;
        this.callSignal.init(user.email, user.name);
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

    // Resolved 1:1 calls (missed/declined) get appended to the open
    // conversation's timeline live, if that conversation is the one open.
    this.callLoggedSub = this.callSignal.callLogged$.subscribe(
      ({ call, status, startedAt }) => {
        this.pushLocalCallEntry(call, status, startedAt);
      },
    );

    this.groupService
      .getMyGroups()
      .subscribe((groups) => (this.groups = groups));
  }

  openGroupSettings(): void {
    this.groupSettingsOpen = true;
  }

  onGroupSettingsClosed(result: Group | 'deleted' | 'left' | null): void {
    this.groupSettingsOpen = false;

    if (result === 'deleted' || result === 'left') {
      this.groups = this.groups.filter((g) => g.id !== this.selectedGroup?.id);
      this.selectedGroup = null;
      this.timeline = [];
      return;
    }

    if (result) {
      const idx = this.groups.findIndex((g) => g.id === result.id);
      if (idx >= 0) this.groups[idx] = result;
      this.selectedGroup = result;
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
    if (!this.selectedGroup) return;
    this.callSignal.startGroupCall(
      this.selectedGroup.id,
      this.selectedGroup.name,
      type,
    );
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

  selectUser(user: any): void {
    this.selectedUser = user;
    this.selectedGroup = null;
    this.timeline = [];

    this.conversationService.getTimeline(user.email).subscribe({
      next: (items) => {
        this.timeline = items;
        this.scrollToBottom();
      },
      error: (err) => console.error('Failed to load conversation:', err),
    });
  }

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

  // ── Calling — just delegates to the global service ──────

  startCall(type: 'video' | 'audio'): void {
    if (!this.selectedUser) return;
    this.callSignal.startCall(
      this.selectedUser.email,
      this.selectedUser.name,
      type,
    );
  }

  private pushLocalCallEntry(
    call: any,
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
    this.groupChatSub?.unsubscribe();
    this.callLoggedSub?.unsubscribe();
  }
}
