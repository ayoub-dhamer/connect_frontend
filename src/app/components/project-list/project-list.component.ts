import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {

    projects: any[] = [];
    filteredProjects: any[] = [];
    searchTerm = '';
    loading = false;
    error?: string;
  
    pagedProjects: any[] = [];
      // Pagination variables
    currentPage = 1;
    pageSize = 5;
    pageSizes = [5, 10, 20];
    totalPages = 1;
  
    constructor(private projectService: ProjectService) {}
  
    ngOnInit(): void {
      this.loadProjects();
    }
  
    loadProjects() {
      this.loading = true;
      this.projectService.getAll().subscribe({
        next: (data) => {
          this.projects = data;
          this.filteredProjects = data;
          this.updatePagination();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load projects';
          this.loading = false;
        }
      });
    }
  
    applyFilter() {
      const term = this.searchTerm.trim().toLowerCase();
      this.filteredProjects = this.projects.filter(
        u =>
          u.name?.toLowerCase().includes(term) 
      );
       this.currentPage = 1;
      this.updatePagination();
    }
  
    updatePagination() {
      this.totalPages = Math.ceil(this.filteredProjects.length / this.pageSize);
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.pagedProjects = this.filteredProjects.slice(start, end);
    }
  
     nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.updatePagination();
      }
    }
  
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updatePagination();
      }
    }
  
    deleteProject(project: any) {
      if (!confirm(`Delete ${project.name}?`)) return;
      this.projectService.delete(project.id).subscribe(() => this.loadProjects());
    }


    // MODAL STATE
modalOpen = false;
modalTitle = '';
modalItems: string[] = [];
pagedModalItems: string[] = [];

modalPage = 1;
modalPageSize = 10;
modalTotalPages = 1;

openModal(items: string[], title: string) {
  this.modalOpen = true;
  this.modalTitle = title;

  this.modalItems = items ?? [];
  this.modalPage = 1;

  this.updateModalPagination();
}


closeModal() {
  this.modalOpen = false;
}

// Pagination logic for modal
updateModalPagination() {
  this.modalTotalPages = Math.ceil(this.modalItems.length / this.modalPageSize);
  const start = (this.modalPage - 1) * this.modalPageSize;
  const end = start + this.modalPageSize;
  this.pagedModalItems = this.modalItems.slice(start, end);
}

nextModalPage() {
  if (this.modalPage < this.modalTotalPages) {
    this.modalPage++;
    this.updateModalPagination();
  }
}

prevModalPage() {
  if (this.modalPage > 1) {
    this.modalPage--;
    this.updateModalPagination();
  }
}

getParticipantLabels(project: any): string[] {
  return project.participants.map(
    (p: any) => `${p.name} (${p.email})`
  );
}

getTaskLabels(project: any): string[] {
  return project.tasks.map(
    (t: any) => `${t.title} - ${t.status}`
  );
}



}
