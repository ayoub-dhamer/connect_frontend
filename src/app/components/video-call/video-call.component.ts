import { Component, OnDestroy, OnInit } from '@angular/core';
import { SignalingService } from '../../services/signaling.service';
import { Subscription } from 'rxjs';
//import { SignalMessage } from '../../services/signaling.service';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent /*implements OnInit, OnDestroy*/ {
  /*localStream!: MediaStream;
  remoteStream!: MediaStream;
  pc!: RTCPeerConnection;
  roomId = 'room-1'; // for testing; in real app generate unique room per call
  myId = 'user-' + Math.floor(Math.random() * 10000); // replace with logged-in user id/email
  subs!: Subscription;

  // ICE servers: use STUN for dev; add TURN for production
  rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
      // For production add TURN server entry:
      // { urls: 'turn:YOUR_TURN_IP:3478', username: 'user', credential: 'pass' }
    ]
  };

  constructor(private signaling: SignalingService) {}

  async ngOnInit() {
    // Start STOMP connection and subscribe to room
    this.signaling.connect();
    this.signaling.subscribeToRoom(this.roomId);
    this.subs = this.signaling.messages$.subscribe(msg => this.onSignalMessage(msg));

    // Get local media
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
      localVideo.srcObject = this.localStream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
      return;
    }

    // Create PeerConnection
    this.createPeerConnection();
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
    this.signaling.disconnect();
    this.localStream?.getTracks().forEach(t => t.stop());
    this.pc?.close();
  }

  createPeerConnection() {
    this.pc = new RTCPeerConnection(this.rtcConfig);

    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.localStream);
    });

    // Remote stream handling
    this.remoteStream = new MediaStream();
    const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
    remoteVideo.srcObject = this.remoteStream;

    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };

    // ICE candidates -> send to signaling server
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        const msg: SignalMessage = {
          type: 'candidate',
          roomId: this.roomId,
          sender: this.myId,
          payload: { candidate: event.candidate }
        };
        this.signaling.sendToRoom(this.roomId, msg);
      }
    };
  }

  // Called when user clicks "Call" (acts as caller)
  async startCall() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const msg: SignalMessage = {
      type: 'offer',
      roomId: this.roomId,
      sender: this.myId,
      payload: { sdp: offer }
    };

    this.signaling.sendToRoom(this.roomId, msg);
  }

  // Called when user wants to answer (callee does this automatically upon receiving offer)
  async createAnswer(offerSdp: any, sender: string) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    const msg: SignalMessage = {
      type: 'answer',
      roomId: this.roomId,
      sender: this.myId,
      payload: { sdp: answer }
    };

    this.signaling.sendToRoom(this.roomId, msg);
  }

  // handle incoming signaling messages
  async onSignalMessage(msg: SignalMessage) {
    if (msg.sender === this.myId) return; // ignore our own broadcasts

    if (msg.type === 'offer') {
      console.log('Received offer from', msg.sender);
      await this.createAnswer(msg.payload.sdp, msg.sender);
    } else if (msg.type === 'answer') {
      console.log('Received answer');
      await this.pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
    } else if (msg.type === 'candidate') {
      console.log('Received ICE candidate');
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
      } catch (err) {
        console.error('Error adding ICE candidate', err);
      }
    }
  }

  hangUp() {
    this.pc.getSenders().forEach(s => s.track?.stop());
    this.pc.close();
    this.signaling.sendToRoom(this.roomId, {
      type: 'leave',
      roomId: this.roomId,
      sender: this.myId
    });
  }*/
}
