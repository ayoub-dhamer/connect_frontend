import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { Group, GroupService } from '../../services/group.service';
import { UserService } from '../../services/user.service';
import { ToastMessageService } from '../../services/toast-message.service';

@Component({
  selector: 'app-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.css'],
})
export class GroupSettingsComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() group: Group | null = null;
  @Input() currentUserEmail = '';
  @Output() closed = new EventEmitter<Group | 'deleted' | 'left' | null>();

  editedName = '';
  addingMembers = false;
  allUsers: any[] = [];
  selectedIdsToAdd = new Set<number>();
  uploading = false;

  promoting = new Set<number>();

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private toast: ToastMessageService,
  ) {}

  get myRole(): 'OWNER' | 'ADMIN' | 'MEMBER' | null {
    return (
      this.group?.members.find((m) => m.email === this.currentUserEmail)
        ?.role ?? null
    );
  }

  get canManage(): boolean {
    return this.myRole === 'OWNER' || this.myRole === 'ADMIN';
  }

  get isOwner(): boolean {
    return this.myRole === 'OWNER';
  }

  promoteToAdmin(userId: number): void {
    if (!this.group || this.promoting.has(userId)) return;
    this.promoting.add(userId);

    this.groupService.changeRole(this.group.id, userId, 'ADMIN').subscribe({
      next: (updated) => {
        this.group = updated;
        this.closed.emit(updated);
        this.promoting.delete(userId);
      },
      error: () => {
        this.toast.error('Failed to change role');
        this.promoting.delete(userId);
      },
    });
  }

  demoteToMember(userId: number): void {
    if (!this.group || this.promoting.has(userId)) return;
    this.promoting.add(userId);

    this.groupService.changeRole(this.group.id, userId, 'MEMBER').subscribe({
      next: (updated) => {
        this.group = updated;
        this.closed.emit(updated);
        this.promoting.delete(userId);
      },
      error: () => {
        this.toast.error('Failed to change role');
        this.promoting.delete(userId);
      },
    });
  }

  transferOwnership(userId: number): void {
    if (
      !this.group ||
      !confirm('Transfer ownership to this member? You will become an admin.')
    )
      return;
    this.groupService.transferOwnership(this.group.id, userId).subscribe({
      next: (updated) => {
        this.group = updated;
        this.closed.emit(updated);
      },
      error: () => this.toast.error('Failed to transfer ownership'),
    });
  }

  ngOnChanges(): void {
    if (this.isOpen && this.group) {
      this.editedName = this.group.name;
      this.addingMembers = false;
      this.selectedIdsToAdd.clear();
    }
  }

  saveRename(): void {
    if (
      !this.group ||
      !this.editedName.trim() ||
      this.editedName === this.group.name
    )
      return;
    this.groupService
      .renameGroup(this.group.id, this.editedName.trim())
      .subscribe({
        next: (updated) => {
          this.group = updated;
          this.closed.emit(updated);
        },
        error: () => this.toast.error('Failed to rename group'),
      });
  }

  openAddMembers(): void {
    this.addingMembers = true;
    this.userService.getAll(0, 100).subscribe((res: any) => {
      const all = res.content ?? res;
      const currentIds = new Set(this.group?.members.map((m) => m.id));
      this.allUsers = all.filter((u: any) => !currentIds.has(u.id));
    });
  }

  toggleAddMember(id: number): void {
    this.selectedIdsToAdd.has(id)
      ? this.selectedIdsToAdd.delete(id)
      : this.selectedIdsToAdd.add(id);
  }

  confirmAddMembers(): void {
    if (!this.group || this.selectedIdsToAdd.size === 0) return;
    this.groupService
      .addMembers(this.group.id, Array.from(this.selectedIdsToAdd))
      .subscribe({
        next: (updated) => {
          this.group = updated;
          this.addingMembers = false;
          this.selectedIdsToAdd.clear();
          this.closed.emit(updated);
        },
        error: () => this.toast.error('Failed to add members'),
      });
  }

  removeMember(userId: number): void {
    if (!this.group || !confirm('Remove this member from the group?')) return;
    this.groupService.removeMember(this.group.id, userId).subscribe({
      next: (updated) => {
        this.group = updated;
        this.closed.emit(updated);
      },
      error: (err) =>
        this.toast.error(err.error?.error ?? 'Failed to remove member'),
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.group) return;

    this.uploading = true;
    this.groupService.uploadAvatar(this.group.id, file).subscribe({
      next: (updated) => {
        this.group = updated;
        this.uploading = false;
        this.closed.emit(updated);
      },
      error: (err) => {
        this.toast.error(err.error?.error ?? 'Failed to upload avatar');
        this.uploading = false;
      },
    });
  }

  leaveGroup(): void {
    if (!this.group || !confirm(`Leave "${this.group.name}"?`)) return;
    this.groupService.leaveGroup(this.group.id).subscribe({
      next: () => this.closed.emit('left'),
      error: (err) =>
        this.toast.error(err.error?.error ?? 'Failed to leave group'),
    });
  }

  deleteGroup(): void {
    if (
      !this.group ||
      !confirm(`Delete "${this.group.name}"? This cannot be undone.`)
    )
      return;
    this.groupService.deleteGroup(this.group.id).subscribe({
      next: () => this.closed.emit('deleted'),
      error: () => this.toast.error('Failed to delete group'),
    });
  }

  cancel(): void {
    this.closed.emit(null);
  }
}
