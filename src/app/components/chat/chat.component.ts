import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent /*implements OnInit, OnDestroy*/ {
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
}
