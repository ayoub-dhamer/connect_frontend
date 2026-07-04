import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Router } from '@angular/router';

interface ProjectGroup {
  projectId: number | null;
  projectName: string;
  tasks: any[];
  expanded: boolean;
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnInit {
  tasks: any[] = [];
  groups: ProjectGroup[] = [];
  loading = false;
  error?: string;

  searchTerm = '';
  statusFilter = '';
  priorityFilter = '';

  readonly statuses = ['ONGOING', 'DONE', 'FAILED', 'EXPIRED', 'CANCELLED'];
  readonly priorities = ['HIGH', 'MEDIUM', 'LOW'];

  constructor(
    private taskService: TaskService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = undefined;

    this.taskService.getAll().subscribe({
      next: (res: any) => {
        this.tasks = res.content ?? res;
        this.buildGroups();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load tasks';
        this.loading = false;
      },
    });
  }

  private buildGroups(): void {
    const filtered = this.applyFilters(this.tasks);
    const map = new Map<string, ProjectGroup>();

    for (const t of filtered) {
      const projectId = t.project?.id ?? null;
      const projectName = t.project?.name ?? 'No Project';
      const key = String(projectId ?? 'none');

      if (!map.has(key)) {
        map.set(key, {
          projectId,
          projectName,
          tasks: [],
          expanded: true,
        });
      }
      map.get(key)!.tasks.push(t);
    }

    this.groups = Array.from(map.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName),
    );
  }

  private applyFilters(tasks: any[]): any[] {
    const term = this.searchTerm.trim().toLowerCase();

    return tasks.filter((t) => {
      const matchesTerm =
        !term ||
        t.name?.toLowerCase().includes(term) ||
        t.project?.name?.toLowerCase().includes(term);
      const matchesStatus =
        !this.statusFilter || t.status === this.statusFilter;
      const matchesPriority =
        !this.priorityFilter || t.priority === this.priorityFilter;
      return matchesTerm && matchesStatus && matchesPriority;
    });
  }

  onFilterChange(): void {
    this.buildGroups();
  }

  toggleGroup(group: ProjectGroup): void {
    group.expanded = !group.expanded;
  }

  getAssignedEmails(t: any): string {
    if (!t.assignedTeamMembers?.length) return '—';
    return t.assignedTeamMembers.map((u: any) => u.email).join(', ');
  }

  priorityClass(priority: string): string {
    return `badge priority-${(priority || '').toLowerCase()}`;
  }

  statusClass(status: string): string {
    return `badge status-${(status || '').toLowerCase()}`;
  }

  add(): void {
    this.router.navigate(['/user/tasks/new']);
  }

  edit(t: any): void {
    if (t.id) this.router.navigate(['/user/tasks', t.id]);
  }

  delete(t: any): void {
    if (!t.id || !confirm(`Delete "${t.name}"?`)) return;
    this.taskService.delete(t.id).subscribe(() => this.load());
  }
}
