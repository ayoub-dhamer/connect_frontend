import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { ToastMessageService } from '../../services/toast-message.service';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.css']
})
export class ProjectFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  loading = false;
  users: any[] = [];
  projectId!: number;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private userService: UserService,
    private toast: ToastMessageService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      status: ['ONGOING', Validators.required],
      ownerId: [null, Validators.required]
    });

    this.userService.getAll().subscribe((res: any) => {
      this.users = res.content ?? res;
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.projectId = +id;
      this.projectService.getById(this.projectId).subscribe((p: any) => {
        this.form.patchValue({
          name: p.name,
          status: p.status,
          ownerId: p.ownerId
        });
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;

    const payload = {
      name: this.form.value.name,
      status: this.form.value.status,
      owner: { id: this.form.value.ownerId }
    };

    const request$ = this.isEdit
      ? this.projectService.update(this.projectId, payload)
      : this.projectService.create(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(this.isEdit ? 'Project updated!' : 'Project created!');
        this.router.navigate(['/user/projects']);
      },
      error: () => {
        this.toast.error('Something went wrong');
        this.loading = false;
      }
    });
  }
}