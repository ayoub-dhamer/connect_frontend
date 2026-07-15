import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Group {
  id: number;
  name: string;
  createdByEmail: string;
  members: { id: number; email: string; name: string; pictureUrl: string }[];
}

export interface GroupMessage {
  id: number;
  groupId: number;
  senderEmail: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface ParticipantOutcome {
  email: string;
  name: string;
  outcome: 'JOINED' | 'DECLINED' | 'MISSED' | 'NO_ANSWER' | 'CANCELLED';
}

export interface GroupCallSession {
  callId: string;
  groupId: number;
  startedByEmail: string;
  startedByName: string;
  callType: 'VIDEO' | 'AUDIO';
  startedAt: string;
  endedAt: string | null;
  participants: ParticipantOutcome[];
}

@Injectable({ providedIn: 'root' })
export class GroupService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  createGroup(name: string, memberIds: number[]): Observable<Group> {
    return this.http.post<Group>(
      this.url('groups'),
      { name, memberIds },
      this.options(),
    );
  }

  getCallHistory(groupId: number): Observable<GroupCallSession[]> {
    return this.http.get<GroupCallSession[]>(
      this.url(`groups/${groupId}/calls`),
      this.options(),
    );
  }

  getMyGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.url('groups'), this.options());
  }

  getGroup(id: number): Observable<Group> {
    return this.http.get<Group>(this.url(`groups/${id}`), this.options());
  }

  getHistory(groupId: number): Observable<GroupMessage[]> {
    return this.http.get<GroupMessage[]>(
      this.url(`groups/${groupId}/messages`),
      this.options(),
    );
  }
}
