import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit {
  projects: any[] = [];
  loading = false;
  error?: string;

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  getParticipantEmails(p: any): string {
  return (p.participants || []).map((x: any) => x.email).join(', ');
}


  load() {
    this.loading = true;
    this.projectService.getAll().subscribe({
      next: data => { this.projects = data; this.loading = false; },
      error: err => { this.error = err.message || 'Failed'; this.loading = false; }
    })
  }

  add() { this.router.navigate(['/projects/new']); }
  edit(p: any) { if (p.id) this.router.navigate(['/projects', p.id]); }
  delete(p: any) { if (!p.id || !confirm(`Delete ${p.name}?`)) return; this.projectService.delete(p.id).subscribe(() => this.load()); }
}
