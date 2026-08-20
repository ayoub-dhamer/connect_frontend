import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import {
  WebSocketService,
  CallSignal,
  GroupCallSignal,
} from './websocket.service';
import { CallService } from './call.service';
import { GroupService } from './group.service';
import { ToastService } from './toast.service';

export interface LoggedCallEvent {
  call: CallSignal;
  status: 'MISSED' | 'DECLINED';
  startedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CallSignalService {
  incomingCall$ = new BehaviorSubject<CallSignal | null>(null);
  outgoingCall$ = new BehaviorSubject<CallSignal | null>(null);
  incomingGroupCall$ = new BehaviorSubject<GroupCallSignal | null>(null);
  outgoingGroupCall$ = new BehaviorSubject<GroupCallSignal | null>(null);

  /** Fires whenever a 1:1 call resolves to MISSED/DECLINED, so ChatComponent
   *  can append it to the open conversation's timeline if relevant. */
  callLogged$ = new Subject<LoggedCallEvent>();

  private inCall = false;
  private outgoingCallTimeout: ReturnType<typeof setTimeout> | null = null;
  private ringtoneAudio: HTMLAudioElement | null = null;
  private initialized = false;
  private readonly tabId = crypto.randomUUID();

  currentUserEmail = '';
  currentUserName = '';

  waitingCall$ = new BehaviorSubject<CallSignal | null>(null);
  private waitingChime: HTMLAudioElement | null = null;

  private readonly OUTGOING_LOCK_KEY = 'outgoing-call-lock';
  private readonly OUTGOING_LOCK_TTL_MS = 45000;

  forceLeaveCurrentCall$ = new Subject<void>();

  constructor(
    private ws: WebSocketService,
    private callService: CallService,
    private router: Router,
    private toast: ToastService,
    private groupService: GroupService,
  ) {}

  /** Call once, from a component guaranteed to live for the whole session. */
  init(currentUserEmail: string, currentUserName: string): void {
    this.currentUserEmail = currentUserEmail;
    this.currentUserName = currentUserName;

    if (this.initialized) return;
    this.initialized = true;

    this.ws.connect();
    this.ws.callSignal$.subscribe((signal) => this.handleCallSignal(signal));
    this.ws.groupCallSignal$.subscribe((signal) =>
      this.handleGroupCallSignal(signal),
    );

    window.addEventListener('beforeunload', this.handleUnload);

    this.checkPendingGroupInvites();
  }

  private checkPendingGroupInvites(): void {
    this.groupService.getPendingInvites().subscribe((invites) => {
      if (invites.length === 0) return;
      // Surface only the most recent one — ringing for multiple simultaneous
      // group invites isn't something the current UI models; take the latest.
      const latest = invites[invites.length - 1];

      this.incomingGroupCall$.next({
        type: 'invite',
        callId: latest.callId,
        roomId: latest.roomId,
        callType: latest.callType.toLowerCase() as 'video' | 'audio',
        callerEmail: latest.callerEmail,
        callerName: latest.callerName,
        groupId: latest.groupId,
        groupName: latest.groupName,
      });
      this.startRingtone();
    });
  }

  markInCall(value: boolean): void {
    this.inCall = value;
  }

  // ── 1:1 ─────────────────────────────────────────────────

  startCall(
    receiverEmail: string,
    receiverName: string,
    type: 'video' | 'audio',
  ): void {
    if (this.inCall || this.outgoingCall$.value || this.incomingCall$.value)
      return;
    if (!this.claimOutgoing()) {
      this.toast.info('You already have a call in progress in another tab');
      return;
    }

    const roomId = this.buildRoomId(this.currentUserEmail, receiverEmail);
    const callId = crypto.randomUUID();

    const invite: CallSignal = {
      type: 'invite',
      callId,
      roomId,
      callType: type,
      callerEmail: this.currentUserEmail,
      callerName: this.currentUserName,
      receiverEmail,
    };

    this.outgoingCall$.next(invite);
    this.ws.sendCallSignal(invite);
    this.startRingtone();

    this.outgoingCallTimeout = setTimeout(() => {
      if (this.outgoingCall$.value?.callId === callId)
        this.cancelOutgoingCall();
    }, 30000);
  }

  cancelOutgoingCall(): void {
    const call = this.outgoingCall$.value;
    if (!call) return;

    this.clearOutgoingTimeout();
    this.stopRingtone();
    this.releaseOutgoing();

    const startedAt = new Date().toISOString();
    this.ws.sendCallSignal({
      ...call,
      type: 'cancel',
      receiverEmail: call.receiverEmail,
      startedAt,
    });
    this.outgoingCall$.next(null);

    this.callService
      .logCall({
        callId: call.callId,
        callerEmail: call.callerEmail,
        receiverEmail: call.receiverEmail,
        callType: call.callType.toUpperCase() as 'VIDEO' | 'AUDIO',
        status: 'MISSED',
        startedAt,
      })
      .subscribe({
        next: () =>
          this.callLogged$.next({ call, status: 'MISSED', startedAt }),
        error: (err) => console.error('Failed to log call:', err),
      });
  }

  acceptCall(): void {
    const call = this.incomingCall$.value;
    if (!call) return;
    this.incomingCall$.next(null);
    this.stopRingtone();
    this.releaseClaim(call.callId);

    this.ws.sendCallSignal({
      ...call,
      type: 'accept',
      receiverEmail: call.callerEmail,
    });
    this.playCallAcceptedTone();
    this.navigateToRoom(call, call.callerEmail);
  }

  declineCall(): void {
    const call = this.incomingCall$.value;
    if (!call) return;
    this.incomingCall$.next(null);
    this.stopRingtone();
    this.releaseClaim(call.callId);

    const startedAt = new Date().toISOString();
    this.ws.sendCallSignal({
      ...call,
      type: 'decline',
      receiverEmail: call.callerEmail,
      startedAt,
    });

    this.callService
      .logCall({
        callId: call.callId,
        callerEmail: call.callerEmail,
        receiverEmail: call.receiverEmail,
        callType: call.callType.toUpperCase() as 'VIDEO' | 'AUDIO',
        status: 'DECLINED',
        startedAt,
      })
      .subscribe({
        next: () =>
          this.callLogged$.next({ call, status: 'DECLINED', startedAt }),
        error: (err) => console.error('Failed to log call:', err),
      });
  }

  private navigateToRoom(call: CallSignal, otherEmail: string): void {
    this.markInCall(true);
    this.router.navigate(['/user/video', call.roomId], {
      queryParams: {
        type: call.callType,
        callId: call.callId,
        callerEmail: call.callerEmail,
        receiverEmail: call.receiverEmail,
        otherEmail,
        isGroup: false,
      },
    });
  }

  private handleCallSignal(signal: CallSignal): void {
    switch (signal.type) {
      case 'invite':
        if (this.inCall || this.outgoingCall$.value) {
          // Already busy in an active call or actively ringing someone —
          // surface a "call waiting" prompt instead of auto-declining.
          if (!this.claimCall(signal.callId)) return;
          this.waitingCall$.next(signal);
          this.playWaitingChime();
          return;
        }
        if (this.incomingCall$.value) {
          // Already have a DIFFERENT incoming call ringing — still busy, decline this one.
          this.ws.sendCallSignal({
            ...signal,
            type: 'decline',
            receiverEmail: signal.callerEmail,
          });
          return;
        }
        if (!this.claimCall(signal.callId)) return;
        this.incomingCall$.next(signal);
        this.startRingtone();
        break;

      case 'waiting':
        // We're the original caller — the person we called is on another call
        // and has chosen to let us wait rather than declining outright.
        if (this.outgoingCall$.value?.callId === signal.callId) {
          this.toast.info(
            'They are on another call — waiting for them to be free',
          );
        }
        break;

      case 'accept':
        if (this.outgoingCall$.value?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          const call = this.outgoingCall$.value;
          this.outgoingCall$.next(null);
          this.playCallAcceptedTone();
          this.navigateToRoom(call, call.receiverEmail);
        }
        break;

      case 'decline':
        if (this.outgoingCall$.value?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          const call = this.outgoingCall$.value;
          this.outgoingCall$.next(null);
          const startedAt = signal.startedAt ?? new Date().toISOString();
          this.callLogged$.next({ call, status: 'DECLINED', startedAt });
        }
        break;

      case 'busy':
        if (this.outgoingCall$.value?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          const call = this.outgoingCall$.value;
          this.outgoingCall$.next(null);
          const startedAt = signal.startedAt ?? new Date().toISOString();
          this.callLogged$.next({ call, status: 'MISSED', startedAt });
          this.toast.info('They are on another call');
        }
        break;

      case 'cancel':
        if (this.incomingCall$.value?.callId === signal.callId) {
          this.stopRingtone();
          this.releaseClaim(signal.callId);
          const call = this.incomingCall$.value;
          this.incomingCall$.next(null);
          const startedAt = signal.startedAt ?? new Date().toISOString();
          this.callLogged$.next({ call, status: 'MISSED', startedAt });
        }
        break;
    }
  }

  private playWaitingChime(): void {
    this.stopWaitingChime();
    this.waitingChime = new Audio('assets/sounds/call-waiting-chime.mp3');
    this.waitingChime.volume = 0.4;
    // A brief chime, not a looping ringtone — plays once, doesn't repeat
    // to avoid interrupting the active call's audio.
    this.waitingChime.play().catch(() => {});
  }

  private stopWaitingChime(): void {
    this.waitingChime?.pause();
    this.waitingChime = null;
  }

  // Accept the new call, ending the current one first.
  acceptWaitingCall(): void {
    const waiting = this.waitingCall$.value;
    if (!waiting) return;
    this.waitingCall$.next(null);
    this.stopWaitingChime();
    this.releaseClaim(waiting.callId);

    // End whatever we're currently doing.
    if (this.inCall) {
      // Tell the video component to hang up before navigating to the new call.
      // markInCall(false) alone doesn't hang up the live WebRTC session —
      // VideoCallComponent needs to actually leave. We navigate away, which
      // triggers its ngOnDestroy -> hangUp() via Angular's route teardown.
      this.forceLeaveCurrentCall$.next();
    } else if (this.outgoingCall$.value) {
      this.cancelOutgoingCall();
    }

    this.ws.sendCallSignal({
      ...waiting,
      type: 'accept',
      receiverEmail: waiting.callerEmail,
    });
    this.playCallAcceptedTone();
    this.navigateToRoom(waiting, waiting.callerEmail);
  }

  declineWaitingCall(): void {
    const waiting = this.waitingCall$.value;
    if (!waiting) return;
    this.waitingCall$.next(null);
    this.stopWaitingChime();
    this.releaseClaim(waiting.callId);

    const startedAt = new Date().toISOString();
    this.ws.sendCallSignal({
      ...waiting,
      type: 'decline',
      receiverEmail: waiting.callerEmail,
      startedAt,
    });

    this.callService
      .logCall({
        callId: waiting.callId,
        callerEmail: waiting.callerEmail,
        receiverEmail: waiting.receiverEmail,
        callType: waiting.callType.toUpperCase() as 'VIDEO' | 'AUDIO',
        status: 'DECLINED',
        startedAt,
      })
      .subscribe({ error: (err) => console.error('Failed to log call:', err) });
  }

  /** Puts the caller "on hold" — tells them to wait, dismisses our dialog,
   *  but keeps the invite claimed so we can come back and accept it later
   *  via the pending-invites mechanism (already built for late-login). */
  holdWaitingCall(): void {
    const waiting = this.waitingCall$.value;
    if (!waiting) return;
    this.waitingCall$.next(null);
    this.stopWaitingChime();
    // Deliberately do NOT release the claim or send decline — the invite
    // stays "pending" server-side (NO_ANSWER-equivalent for 1:1 isn't tracked
    // the same way as group, so for 1:1 we just don't respond at all; the
    // caller's own 30s timeout will fire if we never come back to it).

    this.ws.sendCallSignal({
      ...waiting,
      type: 'waiting',
      receiverEmail: waiting.callerEmail,
    });
    this.toast.info(`${waiting.callerName} is waiting`);
  }

  // ── Group ───────────────────────────────────────────────

  startGroupCall(
    groupId: number,
    groupName: string,
    type: 'video' | 'audio',
  ): void {
    if (
      this.inCall ||
      this.outgoingCall$.value ||
      this.incomingCall$.value ||
      this.outgoingGroupCall$.value ||
      this.incomingGroupCall$.value
    )
      return;
    if (!this.claimOutgoing()) {
      this.toast.info('You already have a call in progress in another tab');
      return;
    }

    const callId = crypto.randomUUID();
    const roomId = `group-${groupId}-${callId}`;

    const invite: GroupCallSignal = {
      type: 'invite',
      callId,
      roomId,
      callType: type,
      callerEmail: this.currentUserEmail,
      callerName: this.currentUserName,
      groupId,
      groupName,
    };

    this.outgoingGroupCall$.next(invite);
    this.ws.sendGroupCallSignal(invite);
    this.startRingtone();

    this.outgoingCallTimeout = setTimeout(() => {
      if (this.outgoingGroupCall$.value?.callId === callId)
        this.cancelOutgoingGroupCall();
    }, 30000);
  }

  cancelOutgoingGroupCall(): void {
    const call = this.outgoingGroupCall$.value;
    if (!call) return;

    this.clearOutgoingTimeout();
    this.stopRingtone();
    this.releaseOutgoing();

    this.ws.sendGroupCallSignal({ ...call, type: 'cancel' });
    this.outgoingGroupCall$.next(null);
  }

  acceptGroupCall(): void {
    const call = this.incomingGroupCall$.value;
    if (!call) return;
    this.incomingGroupCall$.next(null);
    this.stopRingtone();
    this.releaseClaim(call.callId);

    this.ws.sendGroupCallSignal({
      ...call,
      type: 'accept',
      respondentEmail: this.currentUserEmail,
    });
    this.playCallAcceptedTone();
    this.navigateToGroupRoom(call);
  }

  declineGroupCall(): void {
    const call = this.incomingGroupCall$.value;
    if (!call) return;
    this.incomingGroupCall$.next(null);
    this.stopRingtone();
    this.releaseClaim(call.callId);

    this.ws.sendGroupCallSignal({
      ...call,
      type: 'decline',
      respondentEmail: this.currentUserEmail,
    });
  }

  private navigateToGroupRoom(call: GroupCallSignal): void {
    this.markInCall(true);
    this.router.navigate(['/user/video', call.roomId], {
      queryParams: {
        type: call.callType,
        callId: call.callId,
        groupId: call.groupId,
        groupName: call.groupName,
        isGroup: true,
      },
    });
  }

  private handleGroupCallSignal(signal: GroupCallSignal): void {
    switch (signal.type) {
      case 'invite':
        if (
          this.inCall ||
          this.outgoingCall$.value ||
          this.incomingCall$.value ||
          this.outgoingGroupCall$.value ||
          this.incomingGroupCall$.value
        ) {
          this.ws.sendGroupCallSignal({
            ...signal,
            type: 'decline',
            respondentEmail: this.currentUserEmail,
          });
          return;
        }
        if (!this.claimCall(signal.callId)) return;
        this.incomingGroupCall$.next(signal);
        this.startRingtone();
        break;

      case 'accept':
        if (this.outgoingGroupCall$.value?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          const call = this.outgoingGroupCall$.value;
          this.outgoingGroupCall$.next(null);
          this.playCallAcceptedTone();
          this.navigateToGroupRoom(call);
        } else {
          this.toast.info(`${signal.respondentEmail} joined the call`);
        }
        break;

      case 'decline':
        if (this.outgoingGroupCall$.value?.callId === signal.callId) {
          this.toast.info(`${signal.respondentEmail} declined`);
        }
        break;

      case 'all-declined':
        if (this.outgoingGroupCall$.value?.callId === signal.callId) {
          this.clearOutgoingTimeout();
          this.stopRingtone();
          this.releaseOutgoing();
          this.outgoingGroupCall$.next(null);
          this.toast.info('Everyone declined the call');
        }
        break;

      case 'cancel':
        if (this.incomingGroupCall$.value?.callId === signal.callId) {
          this.stopRingtone();
          this.releaseClaim(signal.callId);
          this.incomingGroupCall$.next(null);
        }
        break;
    }
  }

  // ── Tab close / navigate-away safety net ────────────────

  private handleUnload = (): void => {
    const outgoing = this.outgoingCall$.value;
    if (outgoing) {
      this.ws.sendCallSignal({
        ...outgoing,
        type: 'cancel',
        receiverEmail: outgoing.receiverEmail,
      });
    }
    const incoming = this.incomingCall$.value;
    if (incoming) {
      this.ws.sendCallSignal({
        ...incoming,
        type: 'decline',
        receiverEmail: incoming.callerEmail,
      });
    }
    const outgoingGroup = this.outgoingGroupCall$.value;
    if (outgoingGroup) {
      this.ws.sendGroupCallSignal({ ...outgoingGroup, type: 'cancel' });
    }
    const incomingGroup = this.incomingGroupCall$.value;
    if (incomingGroup) {
      this.ws.sendGroupCallSignal({
        ...incomingGroup,
        type: 'decline',
        respondentEmail: this.currentUserEmail,
      });
    }
  };

  // ── Shared helpers ──────────────────────────────────────

  private buildRoomId(a: string, b: string): string {
    return [a, b].sort().join('__').replace(/[@.]/g, '-');
  }

  private clearOutgoingTimeout(): void {
    if (this.outgoingCallTimeout) {
      clearTimeout(this.outgoingCallTimeout);
      this.outgoingCallTimeout = null;
    }
  }

  private startRingtone(): void {
    this.stopRingtone();
    this.ringtoneAudio = new Audio('assets/sounds/ringtone.mp3');
    this.ringtoneAudio.loop = true;
    this.ringtoneAudio.volume = 0.6;
    this.ringtoneAudio.play().catch(() => {});
  }

  private stopRingtone(): void {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
      this.ringtoneAudio = null;
    }
  }

  private playCallAcceptedTone(): void {
    const audio = new Audio('assets/sounds/call-accepted.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }

  private claimCall(callId: string): boolean {
    const key = `call-claim-${callId}`;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, this.tabId);
    return true;
  }

  private releaseClaim(callId: string): void {
    localStorage.removeItem(`call-claim-${callId}`);
  }

  private claimOutgoing(): boolean {
    const existing = localStorage.getItem(this.OUTGOING_LOCK_KEY);
    if (existing) {
      const { timestamp } = JSON.parse(existing);
      if (Date.now() - timestamp < this.OUTGOING_LOCK_TTL_MS) return false;
    }
    localStorage.setItem(
      this.OUTGOING_LOCK_KEY,
      JSON.stringify({ tabId: this.tabId, timestamp: Date.now() }),
    );
    return true;
  }

  private releaseOutgoing(): void {
    const existing = localStorage.getItem(this.OUTGOING_LOCK_KEY);
    if (existing) {
      const { tabId } = JSON.parse(existing);
      if (tabId === this.tabId) localStorage.removeItem(this.OUTGOING_LOCK_KEY);
    }
  }
}
