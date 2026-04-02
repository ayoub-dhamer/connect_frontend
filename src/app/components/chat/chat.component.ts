import { Component, OnDestroy, OnInit } from '@angular/core';
//import { WebSocketService, ChatMessage } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent /*implements OnInit, OnDestroy*/ /*implements OnInit, OnDestroy*/ {
 


 /*  messages: ChatMessage[] = [];
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
  }*/
}
