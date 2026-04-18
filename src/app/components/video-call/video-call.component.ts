import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { WebSocketService, SignalMessage } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;

  roomId = '';
  micOn = true;
  camOn = true;

  remotePeers: { id: string; stream: MediaStream }[] = [];

  private localStream!: MediaStream;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private currentUserEmail = '';
  private sub!: Subscription;

  private readonly ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  constructor(
    private route: ActivatedRoute,
    private ws: WebSocketService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || 'default-room';

    this.auth.loadUser().subscribe(user => {
      if (user) this.currentUserEmail = user.email;
    });

    this.ws.connect();
    this.ws.subscribeToRoom(this.roomId);

    this.sub = this.ws.signals$.subscribe(signal =>
      this.handleSignal(signal)
    );

    this.startLocalStream();
  }

  async startLocalStream(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.localVideoRef.nativeElement.srcObject = this.localStream;

      this.ws.sendSignalMessage(this.roomId, {
        type: 'join',
        roomId: this.roomId,
        sender: this.currentUserEmail
      });
    } catch (e) {
      console.error('Could not access camera/mic', e);
    }
  }

  async handleSignal(signal: SignalMessage): Promise<void> {
    if (signal.sender === this.currentUserEmail) return;

    if (signal.type === 'join') {
      await this.createOffer(signal.sender);
    } else if (signal.type === 'offer') {
      await this.handleOffer(signal);
    } else if (signal.type === 'answer') {
      await this.handleAnswer(signal);
    } else if (signal.type === 'candidate') {
      await this.handleCandidate(signal);
    } else if (signal.type === 'leave') {
      this.removePeer(signal.sender);
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.ICE_SERVERS);

    this.localStream.getTracks().forEach(track =>
      pc.addTrack(track, this.localStream)
    );

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.ws.sendSignalMessage(this.roomId, {
          type: 'candidate',
          roomId: this.roomId,
          sender: this.currentUserEmail,
          payload: candidate.toJSON()
        });
      }
    };

    pc.ontrack = ({ streams }) => {
      const existing = this.remotePeers.find(p => p.id === peerId);
      if (existing) {
        existing.stream = streams[0];
      } else {
        this.remotePeers.push({
          id: peerId,
          stream: streams[0]
        });
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  async createOffer(peerId: string): Promise<void> {
    const pc = this.createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.ws.sendSignalMessage(this.roomId, {
      type: 'offer',
      roomId: this.roomId,
      sender: this.currentUserEmail,
      payload: offer
    });
  }

  async handleOffer(signal: SignalMessage): Promise<void> {
    const pc = this.createPeerConnection(signal.sender);

    await pc.setRemoteDescription(
      new RTCSessionDescription(signal.payload)
    );

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.ws.sendSignalMessage(this.roomId, {
      type: 'answer',
      roomId: this.roomId,
      sender: this.currentUserEmail,
      payload: answer
    });
  }

  async handleAnswer(signal: SignalMessage): Promise<void> {
    const pc = this.peerConnections.get(signal.sender);
    if (pc) {
      await pc.setRemoteDescription(
        new RTCSessionDescription(signal.payload)
      );
    }
  }

  async handleCandidate(signal: SignalMessage): Promise<void> {
    const pc = this.peerConnections.get(signal.sender);
    if (pc && signal.payload) {
      await pc.addIceCandidate(
        new RTCIceCandidate(signal.payload)
      );
    }
  }

  removePeer(peerId: string): void {
    this.peerConnections.get(peerId)?.close();
    this.peerConnections.delete(peerId);
    this.remotePeers = this.remotePeers.filter(p => p.id !== peerId);
  }

  toggleMic(): void {
    this.micOn = !this.micOn;
    this.localStream.getAudioTracks().forEach(t =>
      (t.enabled = this.micOn)
    );
  }

  toggleCam(): void {
    this.camOn = !this.camOn;
    this.localStream.getVideoTracks().forEach(t =>
      (t.enabled = this.camOn)
    );
  }

  hangUp(): void {
    this.ws.sendSignalMessage(this.roomId, {
      type: 'leave',
      roomId: this.roomId,
      sender: this.currentUserEmail
    });

    this.localStream?.getTracks().forEach(t => t.stop());
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    this.remotePeers = [];
    this.ws.unsubscribeFromRoom(this.roomId);
  }

  ngOnDestroy(): void {
    this.hangUp();
    this.sub?.unsubscribe();
  }
}