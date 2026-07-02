import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  sideBarOpen = true;

  sideBarToggler() {
    this.sideBarOpen = !this.sideBarOpen;
  }

  ngOnInit(): void {
    this.auth.isAuthenticated().subscribe((isAuth) => {
      if (!isAuth) {
        this.router.navigate(['/login']);
        return;
      }
      console.log('Admin loaded.');
    });
  }
}
