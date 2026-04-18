import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  totalUsers = 0;
  totalProjects = 0;
  totalTasks = 0;
  activeSubscriptions = 0;
  recentUsers: any[] = [];

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.userService.getAll().subscribe((res: any) => {
      const users = res.content ?? res;
      this.totalUsers = res.totalElements ?? users.length;
      this.activeSubscriptions = users.filter(
        (u: any) => u.subscriptionStatus === 'ACTIVE'
      ).length;
      this.recentUsers = users.slice(0, 10);
    });

    this.projectService.getAll().subscribe((res: any) => {
      this.totalProjects = res.totalElements ?? (res.content ?? res).length;
    });

    this.taskService.getAll().subscribe((res: any) => {
      this.totalTasks = res.totalElements ?? (res.content ?? res).length;
    });
  }
}