import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit {

 projects: any[] = [];
filteredProjects: any[] = [];

searchTerm = "";
pageSize = 5;
currentPage = 1;
totalPages = 1;

pageSizes = [5, 10, 20, 50];



 filterProjects() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProjects = this.projects.filter(
      u =>
        u.name?.toLowerCase().includes(term) ||
        u.owner?.email.toLowerCase().includes(term)
    );
     this.currentPage = 1;
    this.updatePagination();
  }

getParticipantEmailsArray(p: any): string[] {
  const emails = this.getParticipantEmails(p);
  return typeof emails === "string" ? emails.split(", ") : [];
}

updatePagination() {
  this.totalPages = Math.ceil(this.filteredProjects.length / this.pageSize);
}

nextPage() {
  if (this.currentPage < this.totalPages) this.currentPage++;
}

previousPage() {
  if (this.currentPage > 1) this.currentPage--;
}


  
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


}
