/*import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebSocketService, SignalMessage } from '../../services/websocket.service';

@Component({
  selector: 'app-video-room',
  templateUrl: './video-room.component.html',
  styleUrls: ['./video-room.component.css']
})
export class VideoRoomComponent implements OnInit, OnDestroy {
  roomId!: string;
  localStream!: MediaStream;
  peers: { [key: string]: RTCPeerConnection } = {};

  constructor(private route: ActivatedRoute, private ws: WebSocketService) {}

  async ngOnInit() {
    this.roomId = this.route.snapshot.params['roomId'];

    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const localVideo: HTMLVideoElement = document.getElementById('localVideo') as HTMLVideoElement;
    localVideo.srcObject = this.localStream;

    this.ws.subscribeToRoom(this.roomId, msg => this.handleSignal(msg));

    this.ws.sendSignalMessage(this.roomId, { type: 'join', roomId: this.roomId, sender: 'me@example.com', payload: {} });
  }

  ngOnDestroy() {
    this.ws.unsubscribeFromRoom(this.roomId);
    Object.values(this.peers).forEach(p => p.close());
  }

  handleSignal(msg: SignalMessage) {
    // Implement offer/answer/candidate handling here
    console.log('Signal received:', msg);
  }
}*/