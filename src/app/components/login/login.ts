// src/app/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-login',
  template: `<div id="g_id_signin"></div>`,
})
export class Login implements OnInit {
  constructor(private auth: Auth, private router: Router) {}

  ngOnInit(): void {
    google.accounts.id.initialize({
      client_id: '309812948913-qsfe3lqofflab68vclc1tcbn79t6597g.apps.googleusercontent.com',
      callback: (response: any) => this.handleCredentialResponse(response),
    });

    google.accounts.id.renderButton(document.getElementById('g_id_signin'), {
      theme: 'outline',
      size: 'large',
    });
  }

  handleCredentialResponse(response: any) {
    this.auth.loginWithGoogle(response.credential).subscribe({
      next: (res: any) => {
        this.auth.saveToken(res.jwt);
        this.router.navigate(['/dashboard']);
      },
      error: err => console.error(err)
    });
  }
}
