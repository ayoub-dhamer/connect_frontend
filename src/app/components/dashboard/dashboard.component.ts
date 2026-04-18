import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ProjectService } from 'src/app/services/project.service';
import { TaskService } from 'src/app/services/task.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName = '';
  totalProjects = 0;
  totalTasks = 0;
  highPriorityTasks = 0;
  ongoingTasks = 0;
  recentProjects: any[] = [];
  recentTasks: any[] = [];
 
  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private auth: AuthService
  ) {}
 
  ngOnInit(): void {
    this.auth.loadUser().subscribe(user => {
      if (user) this.userName = user.name;
    });
 
    this.projectService.getAll().subscribe((res: any) => {
      const projects = res.content ?? res;
      this.totalProjects = res.totalElements ?? projects.length;
      this.recentProjects = projects.slice(0, 5);
    });
 
    this.taskService.getAll().subscribe((res: any) => {
      const tasks = res.content ?? res;
      this.totalTasks = res.totalElements ?? tasks.length;
      this.highPriorityTasks = tasks.filter((t: any) => t.priority === 'HIGH').length;
      this.ongoingTasks = tasks.filter((t: any) => t.status === 'ONGOING').length;
      this.recentTasks = tasks.slice(0, 5);
    });
  }
 
  priorityColor(priority: string): string {
    return priority === 'HIGH' ? 'warn' : priority === 'MEDIUM' ? 'accent' : 'primary';
  }
}