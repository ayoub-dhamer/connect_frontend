import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.css'],
})
export class GroupCreateComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<any | null>();

  name = '';
  allUsers: any[] = [];
  selectedIds = new Set<number>();

  constructor(
    private userService: UserService,
    private groupService: GroupService,
  ) {}

  ngOnChanges(): void {
    if (this.isOpen) {
      this.name = '';
      this.selectedIds.clear();
      this.userService.getAll(0, 100).subscribe((res: any) => {
        this.allUsers = res.content ?? res;
      });
    }
  }

  toggleMember(id: number): void {
    this.selectedIds.has(id)
      ? this.selectedIds.delete(id)
      : this.selectedIds.add(id);
  }

  create(): void {
    if (!this.name.trim() || this.selectedIds.size === 0) return;
    this.groupService
      .createGroup(this.name.trim(), Array.from(this.selectedIds))
      .subscribe({
        next: (group) => this.closed.emit(group),
        error: (err) => console.error('Failed to create group:', err),
      });
  }

  cancel(): void {
    this.closed.emit(null);
  }
}
