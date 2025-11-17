import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.css']
})
export class ProjectFormComponent implements OnInit {
  form!: FormGroup;
  id?: number;
  users: any[] = [];
  loading = false;
  error?: string;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      ownerId: [null, Validators.required],
      participantIds: [[]] // array of user ids
    });

    this.userService.getAll().subscribe(u => this.users = u);

    console.log(this.users);

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr && idStr !== 'new') {
        this.id = +idStr;
        this.load(this.id);
      }
    });
  }

  load(id: number) {
    this.loading = true;
    this.projectService.getById(id).subscribe({
      next: p => {
        this.form.patchValue({
          name: p.name,
          ownerId: p.owner?.id || null,
          participantIds: (p.participants || []).map((x:any) => x.id)
        });
        this.loading = false;
      },
      error: err => { this.error = err.message || 'Failed'; this.loading = false; }
    });
  }

  save() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const payload: any = {
      name: raw.name,
      owner: this.users.find(u => u.id === raw.ownerId) || undefined,
      participants: (raw.participantIds || []).map((id: number) => this.users.find(u => u.id === id)!).filter(Boolean)
    };

    if (this.id) {
      this.projectService.update(this.id, payload).subscribe(() => this.router.navigate(['/projects']));
    } else {
      this.projectService.create(payload).subscribe(() => this.router.navigate(['/projects']));
    }
  }

  cancel() { this.router.navigate(['/projects']); }
}
