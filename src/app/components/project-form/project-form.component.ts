import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Participant, TaskFormValue } from '../task-form/task-form.component';
import { ProjectService } from 'src/app/services/project.service';

export type ProjectStatus = 'COMPLETED' | 'ONGOING' | 'EXPIRED' | 'CLOSED';

export interface PendingTask extends TaskFormValue {
  /** Resolved from assignedMemberIds purely for display in the task list / summary */
  assignedMemberNames?: string[];
}

type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
})
export class ProjectFormComponent implements OnInit {
  form!: FormGroup;

  currentStep: WizardStep = 1;
  skipped: Record<2 | 3, boolean> = { 2: false, 3: false };

  readonly stepLabels: Record<WizardStep, string> = {
    1: 'Project info',
    2: 'Participants',
    3: 'Tasks',
    4: 'Confirm',
  };

  readonly projectStatus: { value: ProjectStatus; label: string }[] = [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ONGOING', label: 'Ongoing' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'EXPIRED', label: 'Expired' },
  ];

  // ── Participants ──
  participantSearch = '';
  searchResults: Participant[] = [];
  participants: Participant[] = [];
  pendingInvites: string[] = [];
  showInviteRow = false;
  showDropdown = false;

  /** Mock directory — replace with a real UserService.search() call */
  private readonly allUsers: Participant[] = [
    { id: 1, name: 'Sara Amrani', email: 'sara@example.com' },
    { id: 2, name: 'Mark Khalil', email: 'mark@example.com' },
    { id: 3, name: 'Lena Bouaziz', email: 'lena@example.com' },
    { id: 4, name: 'James Dridi', email: 'james@example.com' },
  ];

  // ── Tasks ──
  tasks: PendingTask[] = [];
  taskModalOpen = false;
  editingTaskIndex: number | null = null;

  get taskModalData(): TaskFormValue | null {
    return this.editingTaskIndex !== null
      ? this.tasks[this.editingTaskIndex]
      : null;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150),
        ],
      ],
      description: ['', Validators.maxLength(1000)],
      status: ['ONGOING', Validators.required],
      deadline: [null],
    });
  }

  // ───────────────────────── Step navigation ─────────────────────────

  get progressPercent(): number {
    return (this.currentStep / 4) * 100;
  }

  goToStep(step: WizardStep): void {
    this.currentStep = step;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
    }
    if (this.currentStep === 4) {
      this.submit();
      return;
    }
    this.currentStep = (this.currentStep + 1) as WizardStep;
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep = (this.currentStep - 1) as WizardStep;
    }
  }

  skipStep(step: 2 | 3): void {
    this.skipped[step] = true;
    this.currentStep = (step + 1) as WizardStep;
  }

  /** Rail state helper used by the template to apply is-active/is-done/is-skipped classes */
  railStatus(step: WizardStep): 'active' | 'done' | 'skipped' | 'upcoming' {
    if (step === this.currentStep) return 'active';
    if ((step === 2 || step === 3) && this.skipped[step]) return 'skipped';
    if (step < this.currentStep) return 'done';
    return 'upcoming';
  }

  err(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.touched && c.hasError(error));
  }

  /** Resolves the human-readable label for the currently selected status, used in the confirm step */
  get selectedStatusLabel(): string {
    const value = this.form.get('status')?.value;
    return this.projectStatus.find((s) => s.value === value)?.label ?? '';
  }

  // ───────────────────────── Participants ─────────────────────────

  onParticipantSearch(value: string): void {
    this.participantSearch = value;
    const q = value.trim().toLowerCase();

    if (!q) {
      this.searchResults = [];
      this.showDropdown = false;
      this.showInviteRow = false;
      return;
    }

    this.searchResults = this.allUsers.filter(
      (u) =>
        !this.participants.find((p) => p.id === u.id) &&
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
    this.showDropdown = this.searchResults.length > 0;

    const looksLikeEmail = /\S+@\S+\.\S+/.test(q);
    this.showInviteRow = looksLikeEmail && this.searchResults.length === 0;
  }

  addParticipant(p: Participant): void {
    if (!this.participants.find((x) => x.id === p.id)) {
      this.participants.push(p);
    }
    this.participantSearch = '';
    this.searchResults = [];
    this.showDropdown = false;
    this.showInviteRow = false;
  }

  removeParticipant(id: number): void {
    this.participants = this.participants.filter((p) => p.id !== id);
    this.tasks = this.tasks.map((t) => ({
      ...t,
      assignedMemberIds: t.assignedMemberIds.filter((mid) => mid !== id),
      assignedMemberNames: t.assignedMemberIds
        .filter((mid) => mid !== id)
        .map((mid) => this.participants.find((p) => p.id === mid)?.name ?? ''),
    }));
  }

  inviteByEmail(): void {
    const email = this.participantSearch.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid || this.pendingInvites.includes(email)) return;

    this.pendingInvites.push(email);
    this.participantSearch = '';
    this.searchResults = [];
    this.showDropdown = false;
    this.showInviteRow = false;
  }

  removePendingInvite(email: string): void {
    this.pendingInvites = this.pendingInvites.filter((e) => e !== email);
  }

  // ───────────────────────── Tasks ─────────────────────────

  openAddTaskModal(): void {
    this.editingTaskIndex = null;
    this.taskModalOpen = true;
  }

  openEditTaskModal(index: number): void {
    this.editingTaskIndex = index;
    this.taskModalOpen = true;
  }

  onTaskModalClosed(result: TaskFormValue | null): void {
    this.taskModalOpen = false;

    if (!result) {
      this.editingTaskIndex = null;
      return;
    }

    const enriched: PendingTask = {
      ...result,
      assignedMemberNames: result.assignedMemberIds.map(
        (id) => this.participants.find((p) => p.id === id)?.name ?? '',
      ),
    };

    if (this.editingTaskIndex !== null) {
      this.tasks[this.editingTaskIndex] = enriched;
    } else {
      this.tasks.push(enriched);
    }

    this.editingTaskIndex = null;
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1);
  }

  // ───────────────────────── Submit ─────────────────────────

  submit(): void {
    const payload = {
      ...this.form.value,
      participantIds: this.participants.map((p) => p.id),
      pendingInviteEmails: this.pendingInvites,
      tasks: this.tasks.map(({ assignedMemberNames, ...t }) => t),
    };

    this.projectService.create(payload).subscribe({
      next: () => {
        this.router.navigate(['/users/projects']);
      },
      error: (err) => {
        console.error('Failed to create project:', err);
        // Optional: Add user-facing error handling here
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}
