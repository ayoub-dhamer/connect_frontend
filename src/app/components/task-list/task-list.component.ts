import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html'
})
export class TaskListComponent implements OnInit {
  tasks: any[] = [];
  loading = false;
  error?: string;

  constructor(private taskService: TaskService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.taskService.getAll().subscribe({
      next: data => { this.tasks = data; this.loading = false; },
      error: err => { this.error = err.message || 'Failed'; this.loading = false; }
    });
  }

  getAssignedEmails(t: any): string {
  if (!t.assignedTeamMembers) return '';
  return t.assignedTeamMembers.map((u: any) => u.email).join(', ');
}


  add() { this.router.navigate(['/tasks/new']); }
  edit(t: any) { if (t.id) this.router.navigate(['/tasks', t.id]); }
  delete(t: any) { if (!t.id || !confirm(`Delete ${t.name}?`)) return; this.taskService.delete(t.id).subscribe(() => this.load()); }
}
