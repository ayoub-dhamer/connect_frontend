import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { WebSocketService, ChatMessage } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  users: any[] = [];
  selectedUser: any = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  currentUserEmail = '';
  private sub!: Subscription;

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  constructor(
    private ws: WebSocketService,
    private auth: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.auth.loadUser().subscribe(user => {
      if (user) {
        this.currentUserEmail = user.email;
      }
    });

    this.userService.getAll().subscribe((res: any) => {
      const all = res.content ?? res;
      this.auth.loadUser().subscribe(me => {
        this.users = all.filter((u: any) => u.email !== me?.email);
      });
    });

    this.ws.connect();

    this.sub = this.ws.messages$.subscribe(msg => {
      if (msg) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
    });
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.messages = [];
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selectedUser) return;

    const msg: ChatMessage = {
      sender: { email: this.currentUserEmail },
      receiver: { email: this.selectedUser.email },
      content: this.newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    this.ws.sendChatMessage(msg);
    this.messages.push(msg);
    this.newMessage = '';
    this.scrollToBottom();
  }

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
    this.ws.disconnect();
  }
}