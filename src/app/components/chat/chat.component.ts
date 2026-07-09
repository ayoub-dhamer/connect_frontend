import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import {
  WebSocketService,
  ChatMessage,
  CallInvite,
} from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  users: any[] = [];
  selectedUser: any = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  currentUserEmail = '';
  currentUserName = '';

  incomingCall: CallInvite | null = null;

  private sub!: Subscription;
  private callSub!: Subscription;

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  constructor(
    private ws: WebSocketService,
    private auth: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    private router: Router,
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
      });
    });

    this.ws.connect();

    this.sub = this.ws.messages$.subscribe((msg) => {
      if (msg) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
    });

    this.callSub = this.ws.callInvite$.subscribe((invite) => {
      this.incomingCall = invite;
    });
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.messages = [];

    this.chatService.getHistory(user.email).subscribe({
      next: (history) => {
        this.messages = history;
        this.scrollToBottom();
      },
      error: (err) => console.error('Failed to load chat history:', err),
    });
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selectedUser) return;

    const msg: ChatMessage = {
      senderEmail: this.currentUserEmail,
      receiverEmail: this.selectedUser.email,
      content: this.newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    this.ws.sendChatMessage(msg);
    this.messages.push(msg);
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

    this.ws.sendCallInvite({
      type,
      roomId,
      callerEmail: this.currentUserEmail,
      callerName: this.currentUserName,
      receiverEmail: this.selectedUser.email,
    });

    this.router.navigate(['/user/video', roomId], { queryParams: { type } });
  }

  acceptCall(): void {
    if (!this.incomingCall) return;
    const { roomId, type } = this.incomingCall;
    this.incomingCall = null;
    this.router.navigate(['/user/video', roomId], { queryParams: { type } });
  }

  declineCall(): void {
    this.incomingCall = null;
    // No decline signal sent back to the caller yet — see backend note.
  }

  private buildRoomId(a: string, b: string): string {
    // Deterministic per-pair room so both sides land in the same room
    // even if they each independently trigger the call around the same time.
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
    this.ws.disconnect();
  }
}
