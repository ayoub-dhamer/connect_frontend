import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, filter, take } from 'rxjs';

import {
  WebSocketService,
  SignalMessage,
} from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { CallService } from 'src/app/services/call.service';

interface RemotePeer {
  id: string;
  stream: MediaStream;
  muted: boolean; // local playback mute (unmute overlay)
  micOn: boolean; // their reported mic state
  camOn: boolean; // their reported camera state
}

interface InCallMessage {
  sender: string;
  text: string;
  time: number;
  mine: boolean;
}

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css'],
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;

  roomId = '';
  callType: 'video' | 'audio' = 'video';
  micOn = true;
  camOn = true;

  chatOpen = false;
  chatMessages: InCallMessage[] = [];
  newChatMessage = '';
  unreadChatCount = 0;

  callId = '';
  callerEmail = '';
  receiverEmail = '';
  otherEmail = '';
  private joinedAt = 0;

  remotePeers: RemotePeer[] = [];
  leftPeerNotice: string | null = null;
  private pendingStatus = new Map<
    string,
    { micOn?: boolean; camOn?: boolean }
  >();

  private localStream!: MediaStream;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private currentUserEmail = '';
  private sub!: Subscription;
  private signalSub!: Subscription;
  private leftNoticeTimeout: ReturnType<typeof setTimeout> | null = null;

  private hasHungUp = false;

  private disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  private readonly ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  };

  constructor(
    private route: ActivatedRoute,
    private ws: WebSocketService,
    private auth: AuthService,
    private router: Router,
    private callService: CallService,
  ) {}

  ngOnInit(): void {
    // Defensive reset — in case Angular reused this instance instead of
    // creating a fresh one (can happen navigating video/:roomId → video/:roomId).
    this.resetState();

    this.roomId = this.route.snapshot.paramMap.get('roomId') || 'default-room';
    this.callType =
      (this.route.snapshot.queryParamMap.get('type') as 'video' | 'audio') ||
      'video';
    this.callId = this.route.snapshot.queryParamMap.get('callId') || '';
    this.callerEmail =
      this.route.snapshot.queryParamMap.get('callerEmail') || '';
    this.receiverEmail =
      this.route.snapshot.queryParamMap.get('receiverEmail') || '';
    this.otherEmail = this.route.snapshot.queryParamMap.get('otherEmail') || '';
    this.camOn = this.callType === 'video';
    this.joinedAt = Date.now();

    this.auth.loadUser().subscribe((user) => {
      if (user) this.currentUserEmail = user.email;
    });

    this.ws.connect();

    this.sub = this.ws.connected$
      .pipe(
        filter((connected) => connected),
        take(1),
      )
      .subscribe(() => {
        this.ws.subscribeToRoom(this.roomId);
        this.startLocalStream();
      });

    this.signalSub = this.ws.signals$.subscribe((signal) =>
      this.handleSignal(signal),
    );

    window.addEventListener('beforeunload', this.handleUnload);
  }

  private handleUnload = (): void => {
    this.ws.sendSignalMessage(this.roomId, {
      type: 'leave',
      roomId: this.roomId,
      sender: this.currentUserEmail,
    });
  };

  private resetState(): void {
    this.hasHungUp = false;
    this.remotePeers = [];
    this.leftPeerNotice = null;
    this.pendingStatus.clear();
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    if (this.leftNoticeTimeout) {
      clearTimeout(this.leftNoticeTimeout);
      this.leftNoticeTimeout = null;
    }
  }

  async startLocalStream(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: this.callType === 'video',
        audio: true,
      });

      if (this.callType === 'video') {
        this.localVideoRef.nativeElement.srcObject = this.localStream;
      }

      this.ws.sendSignalMessage(this.roomId, {
        type: 'join',
        roomId: this.roomId,
        sender: this.currentUserEmail,
      });
      // Announce our starting status once tracks are live
      this.broadcastStatus();
    } catch (e) {
      console.error('Could not access camera/mic', e);
    }
  }

  async handleSignal(signal: SignalMessage): Promise<void> {
    if (signal.sender === this.currentUserEmail) return;

    if (signal.type === 'join') {
      // Only the peer with the "larger" email creates the offer,
      // preventing both sides from offering simultaneously (glare).
      if (this.currentUserEmail > signal.sender) {
        await this.createOffer(signal.sender);
      }
      // Re-announce our status to the new joiner regardless of offer direction
      this.broadcastStatus();
      // else: do nothing — wait for their offer instead.
    } else if (signal.type === 'offer') {
      await this.handleOffer(signal);
    } else if (signal.type === 'answer') {
      await this.handleAnswer(signal);
    } else if (signal.type === 'candidate') {
      await this.handleCandidate(signal);
    } else if (signal.type === 'status') {
      this.updatePeerStatus(signal.sender, signal.micOn, signal.camOn);
    } else if (signal.type === 'chat') {
      this.receiveChatMessage(signal.sender, signal.text ?? '');
    } else if (signal.type === 'leave') {
      this.handlePeerLeft(signal.sender);
    }
  }

  private receiveChatMessage(sender: string, text: string): void {
    if (!text.trim()) return;
    this.chatMessages.push({ sender, text, time: Date.now(), mine: false });
    if (!this.chatOpen) {
      this.unreadChatCount++;
    }
    this.playTone('mute'); // reuse an existing short tone as a subtle "message" cue — swap for a dedicated one if you add assets/sounds/chat-ping.mp3
    this.scrollChatToBottom();
  }

  sendChatMessage(): void {
    const text = this.newChatMessage.trim();
    if (!text) return;

    this.ws.sendSignalMessage(this.roomId, {
      type: 'chat',
      roomId: this.roomId,
      sender: this.currentUserEmail,
      text,
    });

    this.chatMessages.push({
      sender: this.currentUserEmail,
      text,
      time: Date.now(),
      mine: true,
    });
    this.newChatMessage = '';
    this.scrollChatToBottom();
  }

  toggleChatPanel(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      this.unreadChatCount = 0;
      this.scrollChatToBottom();
    }
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        const el = this.chatContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 30);
  }

  private updatePeerStatus(
    peerId: string,
    micOn?: boolean,
    camOn?: boolean,
  ): void {
    console.log(`[STATUS] received from ${peerId}: mic=${micOn} cam=${camOn}`);
    const peer = this.remotePeers.find((p) => p.id === peerId);
    console.log(`[STATUS] peer tile exists?`, !!peer);
    if (!peer) {
      // Their tile hasn't been created yet (ontrack hasn't fired) —
      // stash it so it applies the moment the tile does exist.
      const existing = this.pendingStatus.get(peerId) ?? {};
      this.pendingStatus.set(peerId, {
        micOn: micOn ?? existing.micOn,
        camOn: camOn ?? existing.camOn,
      });
      return;
    }

    const micChanged = micOn !== undefined && peer.micOn !== micOn;
    const camChanged = camOn !== undefined && peer.camOn !== camOn;

    if (micOn !== undefined) peer.micOn = micOn;
    if (camOn !== undefined) peer.camOn = camOn;

    if (micChanged || camChanged) {
      this.playTone(micChanged && !peer.micOn ? 'mute' : 'unmute');
    }
  }

  private broadcastStatus(): void {
    console.log(`[STATUS] broadcasting: mic=${this.micOn} cam=${this.camOn}`);

    this.ws.sendSignalMessage(this.roomId, {
      type: 'status',
      roomId: this.roomId,
      sender: this.currentUserEmail,
      micOn: this.micOn,
      camOn: this.camOn,
    });
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.ICE_SERVERS);

    this.localStream
      .getTracks()
      .forEach((track) => pc.addTrack(track, this.localStream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.ws.sendSignalMessage(this.roomId, {
          type: 'candidate',
          roomId: this.roomId,
          sender: this.currentUserEmail,
          payload: candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[ICE] ${peerId} state:`, pc.iceConnectionState);

      if (pc.iceConnectionState === 'disconnected') {
        this.scheduleDropCheck(peerId, pc);
      } else if (
        pc.iceConnectionState === 'connected' ||
        pc.iceConnectionState === 'completed'
      ) {
        this.clearDropCheck(peerId);
      } else if (pc.iceConnectionState === 'failed') {
        this.clearDropCheck(peerId);
        this.handleNetworkDrop(peerId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[PC] ${peerId} connection state:`, pc.connectionState);
    };

    pc.ontrack = ({ streams }) => {
      console.log(`[TRACK] received from ${peerId}:`, streams[0].getTracks());

      const existing = this.remotePeers.find((p) => p.id === peerId);
      if (existing) {
        existing.stream = streams[0];
      } else {
        // Apply any status that arrived before this tile existed.
        const pending = this.pendingStatus.get(peerId);
        this.pendingStatus.delete(peerId);
        // Start muted — guarantees the browser lets playback begin
        // immediately without a gesture. User unmutes via the overlay.
        this.remotePeers.push({
          id: peerId,
          stream: streams[0],
          muted: false,
          micOn: pending?.micOn ?? true,
          camOn: pending?.camOn ?? this.callType === 'video',
        });
      }
      this.broadcastStatus();
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  private scheduleDropCheck(peerId: string, pc: RTCPeerConnection): void {
    this.clearDropCheck(peerId);
    const timer = setTimeout(() => {
      if (
        pc.iceConnectionState === 'disconnected' ||
        pc.iceConnectionState === 'failed'
      ) {
        this.handleNetworkDrop(peerId);
      }
    }, 8000); // 8s grace period — allows brief network blips to self-heal
    this.disconnectTimers.set(peerId, timer);
  }

  private clearDropCheck(peerId: string): void {
    const timer = this.disconnectTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(peerId);
    }
  }

  private handleNetworkDrop(peerId: string): void {
    this.leftPeerNotice = `${peerId} lost connection`;
    this.playTone('leave');
    this.handlePeerLeft(peerId);

    // If that was the only other participant, the call is effectively over —
    // return to chat after a moment rather than leaving a dead room open.
    if (this.remotePeers.length === 0) {
      setTimeout(() => {
        if (this.remotePeers.length === 0 && !this.hasHungUp) {
          this.hangUp();
        }
      }, 3000);
    }
  }

  async createOffer(peerId: string): Promise<void> {
    const pc = this.createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.ws.sendSignalMessage(this.roomId, {
      type: 'offer',
      roomId: this.roomId,
      sender: this.currentUserEmail,
      payload: offer,
    });
  }

  async handleOffer(signal: SignalMessage): Promise<void> {
    const pc = this.createPeerConnection(signal.sender);

    await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.ws.sendSignalMessage(this.roomId, {
      type: 'answer',
      roomId: this.roomId,
      sender: this.currentUserEmail,
      payload: answer,
    });

    this.broadcastStatus();
  }

  async handleAnswer(signal: SignalMessage): Promise<void> {
    const pc = this.peerConnections.get(signal.sender);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
    }
  }

  async handleCandidate(signal: SignalMessage): Promise<void> {
    const pc = this.peerConnections.get(signal.sender);
    if (pc && signal.payload) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
    }
  }

  private handlePeerLeft(peerId: string): void {
    this.peerConnections.get(peerId)?.close();
    this.peerConnections.delete(peerId);
    this.remotePeers = this.remotePeers.filter((p) => p.id !== peerId);
    this.pendingStatus.delete(peerId);
    this.clearDropCheck(peerId);

    this.leftPeerNotice = `${peerId} left the call`;
    this.playTone('leave');

    if (this.leftNoticeTimeout) clearTimeout(this.leftNoticeTimeout);
    this.leftNoticeTimeout = setTimeout(() => {
      this.leftPeerNotice = null;
    }, 4000);
  }

  removePeer(peerId: string): void {
    this.peerConnections.get(peerId)?.close();
    this.peerConnections.delete(peerId);
    this.remotePeers = this.remotePeers.filter((p) => p.id !== peerId);
  }

  unmutePeer(peerId: string): void {
    const peer = this.remotePeers.find((p) => p.id === peerId);
    if (peer) peer.muted = false;
  }

  toggleMic(): void {
    this.micOn = !this.micOn;
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = this.micOn));
    this.broadcastStatus();
    this.playTone(this.micOn ? 'unmute' : 'mute'); // ← hear your own toggle
  }

  toggleCam(): void {
    if (this.callType !== 'video') return;
    this.camOn = !this.camOn;
    this.localStream.getVideoTracks().forEach((t) => (t.enabled = this.camOn));
    this.broadcastStatus();
    this.playTone(this.camOn ? 'unmute' : 'mute'); // ← hear your own toggle
  }

  private playTone(kind: 'mute' | 'unmute' | 'leave'): void {
    const src =
      kind === 'leave'
        ? 'assets/sounds/call-leave.mp3'
        : kind === 'mute'
          ? 'assets/sounds/mute.mp3'
          : 'assets/sounds/unmute.mp3';
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Autoplay may be blocked before any gesture on this page — non-critical, skip silently.
    });
  }

  hangUp(): void {
    if (this.hasHungUp) return;
    this.hasHungUp = true;

    this.disconnectTimers.forEach((t) => clearTimeout(t)); // add this
    this.disconnectTimers.clear();

    this.ws.sendSignalMessage(this.roomId, {
      type: 'leave',
      roomId: this.roomId,
      sender: this.currentUserEmail,
    });

    if (this.callId && this.callerEmail && this.receiverEmail) {
      this.ws.sendCallSignal({
        type: 'ended',
        callId: this.callId,
        roomId: this.roomId,
        callType: this.callType,
        callerEmail: this.callerEmail,
        callerName: '',
        receiverEmail:
          this.callerEmail === this.currentUserEmail
            ? this.receiverEmail
            : this.callerEmail,
      });
    }

    this.localStream?.getTracks().forEach((t) => t.stop());
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    this.remotePeers = [];
    this.ws.unsubscribeFromRoom(this.roomId);

    if (this.callId) {
      const durationSeconds = Math.round((Date.now() - this.joinedAt) / 1000);
      this.callService
        .logCall({
          callId: this.callId,
          callerEmail: this.callerEmail,
          receiverEmail: this.receiverEmail,
          callType: this.callType.toUpperCase() as 'VIDEO' | 'AUDIO',
          status: 'ACCEPTED',
          startedAt: new Date(this.joinedAt).toISOString(),
          endedAt: new Date().toISOString(),
          durationSeconds,
        })
        .subscribe({
          error: (err) => console.error('Failed to log call:', err),
        });
    }

    this.router.navigate(['/user/chat'], {
      queryParams: { with: this.otherEmail },
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.handleUnload);
    this.hangUp();
    this.sub?.unsubscribe();
    this.signalSub?.unsubscribe();
    if (this.leftNoticeTimeout) clearTimeout(this.leftNoticeTimeout);
  }
}
