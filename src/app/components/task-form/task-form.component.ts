import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

export interface Participant {
  id: number;
  name: string;
  email: string;
}

export interface TaskFormValue {
  name: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedMemberIds: number[];
}

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
})
export class TaskFormComponent implements OnChanges {
  /** Controls visibility of the modal overlay */
  @Input() isOpen = false;

  /** Participants available for assignment (from the parent wizard's state) */
  @Input() participants: Participant[] = [];

  /** Pass an existing task here to edit it; omit/null for create mode */
  @Input() task: TaskFormValue | null = null;

  /** Emits the finished task on submit, or null on cancel */
  @Output() closed = new EventEmitter<TaskFormValue | null>();

  name = '';
  nameTouched = false;
  priority: TaskPriority = 'MEDIUM';
  status: TaskStatus = 'TO_DO';
  selectedMemberIds: number[] = [];

  readonly priorities: { value: TaskPriority; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  readonly statuses: { value: TaskStatus; label: string }[] = [
    { value: 'TO_DO', label: 'To do' },
    { value: 'IN_PROGRESS', label: 'In progress' },
    { value: 'DONE', label: 'Done' },
  ];

  get isEditMode(): boolean {
    return !!this.task;
  }

  get nameInvalid(): boolean {
    return this.nameTouched && this.name.trim().length < 3;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset the form whenever the modal is opened, using whatever
    // task (or lack of one) was passed in at that moment.
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.name = this.task?.name ?? '';
    this.priority = this.task?.priority ?? 'MEDIUM';
    this.status = this.task?.status ?? 'TO_DO';
    this.selectedMemberIds = this.task ? [...this.task.assignedMemberIds] : [];
    this.nameTouched = false;
  }

  selectPriority(p: TaskPriority): void {
    this.priority = p;
  }

  selectStatus(s: TaskStatus): void {
    this.status = s;
  }

  toggleMember(id: number): void {
    this.selectedMemberIds = this.selectedMemberIds.includes(id)
      ? this.selectedMemberIds.filter((x) => x !== id)
      : [...this.selectedMemberIds, id];
  }

  isMemberSelected(id: number): boolean {
    return this.selectedMemberIds.includes(id);
  }

  submit(): void {
    this.nameTouched = true;
    if (this.name.trim().length < 3) {
      return;
    }

    const result: TaskFormValue = {
      name: this.name.trim(),
      priority: this.priority,
      status: this.status,
      assignedMemberIds: [...this.selectedMemberIds],
    };

    this.closed.emit(result);
  }

  cancel(): void {
    this.closed.emit(null);
  }

  /** Clicking the dimmed backdrop behaves like Cancel */
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
}
