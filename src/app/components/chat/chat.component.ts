import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebSocketService, ChatMessage } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy /*implements OnInit, OnDestroy*/ {
  /*userEmail = 'alice@mail.com'; // Replace with logged-in user email
  receiverEmail = 'bob@mail.com'; // Receiver’s email
  newMessage = '';
  messages: ChatMessage[] = [];

  private subscription!: Subscription;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.connect(this.userEmail);

    this.subscription = this.chatService.messages$.subscribe((msg) => {
      if (msg) {
        this.messages.push(msg);
      }
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const chatMessage: ChatMessage = {
        sender: { email: this.userEmail },
        receiver: { email: this.receiverEmail },
        content: this.newMessage
      };
      this.chatService.sendMessage(chatMessage);
      this.messages.push(chatMessage); // Show immediately in UI
      this.newMessage = '';
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.chatService.disconnect();
  }*/


   messages: ChatMessage[] = [];
  newMessage = '';
  receiverEmail = '';

  constructor(private ws: WebSocketService) {}

  ngOnInit(): void {
    this.ws.connect((msg) => this.messages.push(msg));
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  send(): void {
    if (!this.newMessage || !this.receiverEmail) return;

    this.ws.sendChatMessage({
      content: this.newMessage,
      senderEmail: 'me@example.com', // replace with actual logged-in email
      receiverEmail: this.receiverEmail
    });

    this.newMessage = '';
  }
}
