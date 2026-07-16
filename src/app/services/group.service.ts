import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GroupMember {
  id: number;
  email: string;
  name: string;
  pictureUrl: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface Group {
  id: number;
  name: string;
  avatarUrl: string | null;
  members: GroupMember[];
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

  renameGroup(groupId: number, name: string): Observable<Group> {
    return this.http.put<Group>(
      this.url(`groups/${groupId}/rename`),
      { name },
      this.options(),
    );
  }

  addMembers(groupId: number, memberIds: number[]): Observable<Group> {
    return this.http.post<Group>(
      this.url(`groups/${groupId}/members`),
      { memberIds },
      this.options(),
    );
  }

  removeMember(groupId: number, userId: number): Observable<Group> {
    return this.http.delete<Group>(
      this.url(`groups/${groupId}/members/${userId}`),
      this.options(),
    );
  }

  leaveGroup(groupId: number): Observable<void> {
    return this.http.post<void>(
      this.url(`groups/${groupId}/leave`),
      {},
      this.options(),
    );
  }

  deleteGroup(groupId: number): Observable<void> {
    return this.http.delete<void>(
      this.url(`groups/${groupId}`),
      this.options(),
    );
  }

  uploadAvatar(groupId: number, file: File): Observable<Group> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Group>(
      this.url(`groups/${groupId}/avatar`),
      formData,
      {
        withCredentials: true,
      },
    );
  }

  transferOwnership(
    groupId: number,
    newOwnerUserId: number,
  ): Observable<Group> {
    return this.http.post<Group>(
      this.url(`groups/${groupId}/transfer-ownership`),
      { newOwnerUserId },
      this.options(),
    );
  }

  changeRole(
    groupId: number,
    userId: number,
    role: 'ADMIN' | 'MEMBER',
  ): Observable<Group> {
    return this.http.put<Group>(
      this.url(`groups/${groupId}/members/${userId}/role`),
      { role },
      this.options(),
    );
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
