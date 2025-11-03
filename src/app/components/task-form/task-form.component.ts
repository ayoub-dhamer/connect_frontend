import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { ProjectService } from '../../services/project.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  users: any[] = [];
  projects: any[] = [];
  priorities = ['HIGH', 'MEDIUM', 'LOW'];
  statuses = ['DONE', 'ONGOING', 'FAILED', 'EXPIRED', 'CANCELLED'];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private userService: UserService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      priority: ['MEDIUM'],
      status: ['ONGOING'],
      assignedIds: [[]],
      projectId: [null]
    });

    this.userService.getAll().subscribe(u => this.users = u);
    this.projectService.getAll().subscribe(p => this.projects = p);

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr && idStr !== 'new') {
        this.id = +idStr;
        this.load(this.id);
      }
    });
  }

  load(id: number) {
    this.taskService.getById(id).subscribe(t => {
      this.form.patchValue({
        name: t.name,
        description: t.description,
        priority: t.priority,
        status: t.status,
        assignedIds: (t.assignedTeamMembers || []).map((x: any) => x.id),
        projectId: t.project?.id || null
      });
    });
  }

  save() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const payload: any = {
      name: raw.name,
      description: raw.description,
      priority: raw.priority,
      status: raw.status,
      assignedTeamMembers: (raw.assignedIds || []).map((id: number) => this.users.find(u => u.id === id)!).filter(Boolean),
      project: this.projects.find(p => p.id === raw.projectId)
    };

    if (this.id) {
      this.taskService.update(this.id, payload).subscribe(() => this.router.navigate(['/tasks']));
    } else {
      this.taskService.create(payload).subscribe(() => this.router.navigate(['/tasks']));
    }
  }

  cancel() { this.router.navigate(['/tasks']); }
}
