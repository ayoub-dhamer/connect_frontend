import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { TaskService } from '../../services/task.service';
import { ToastMessageService } from '../../services/toast-message.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {

  tasks: any[] = [];
  columns = ['name', 'priority', 'status', 'project', 'actions'];
  loading = false;

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  constructor(
    private taskService: TaskService,
    private toast: ToastMessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.taskService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.tasks = res.content ?? res;
        this.totalElements = res.totalElements ?? this.tasks.length;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load tasks');
        this.loading = false;
      }
    });
  }

  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  delete(id: number): void {
    if (!confirm('Delete this task?')) return;

    this.taskService.delete(id).subscribe({
      next: () => {
        this.toast.success('Task deleted');
        this.load();
      },
      error: () => {
        this.toast.error('Cannot delete task');
      }
    });
  }

  priorityColor(priority: string): string {
    return priority === 'HIGH'
      ? 'warn'
      : priority === 'MEDIUM'
        ? 'accent'
        : 'primary';
  }
}