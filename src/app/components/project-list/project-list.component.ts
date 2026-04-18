import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ProjectService } from '../../services/project.service';
import { ToastMessageService } from '../../services/toast-message.service';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {

  projects: any[] = [];
  columns = ['name', 'owner', 'status', 'actions'];
  loading = false;

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  constructor(
    private projectService: ProjectService,
    private toast: ToastMessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.projectService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.projects = res.content ?? res;
        this.totalElements = res.totalElements ?? this.projects.length;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load projects');
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
    if (!confirm('Delete this project?')) return;

    this.projectService.delete(id).subscribe({
      next: () => {
        this.toast.success('Project deleted');
        this.load();
      },
      error: () => {
        this.toast.error('Cannot delete project — it may have tasks linked to it');
      }
    });
  }
}