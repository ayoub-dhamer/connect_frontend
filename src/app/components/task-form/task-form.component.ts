import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { ToastMessageService } from '../../services/toast-message.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  loading = false;

  projects: any[] = [];
  users: any[] = [];
  taskId!: number;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    private toast: ToastMessageService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['MEDIUM', Validators.required],
      status: ['ONGOING', Validators.required],
      projectId: [null, Validators.required],
      assignedUserIds: [[]]
    });

    this.projectService.getAll().subscribe((res: any) => {
      this.projects = res.content ?? res;
    });

    this.userService.getAll().subscribe((res: any) => {
      this.users = res.content ?? res;
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.taskId = +id;
      this.taskService.getById(this.taskId).subscribe((t: any) => {
        this.form.patchValue({
          name: t.name,
          description: t.description,
          priority: t.priority,
          status: t.status,
          projectId: t.project?.id,
          assignedUserIds: t.assignedTeamMembers?.map((u: any) => u.id) ?? []
        });
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const v = this.form.value;

    const payload = {
      name: v.name,
      description: v.description,
      priority: v.priority,
      status: v.status,
      project: { id: v.projectId },
      assignedTeamMembers: v.assignedUserIds.map((id: number) => ({ id }))
    };

    const request$ = this.isEdit
      ? this.taskService.update(this.taskId, payload)
      : this.taskService.create(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(this.isEdit ? 'Task updated!' : 'Task created!');
        this.router.navigate(['/tasks']);
      },
      error: () => {
        this.toast.error('Something went wrong');
        this.loading = false;
      }
    });
  }
}