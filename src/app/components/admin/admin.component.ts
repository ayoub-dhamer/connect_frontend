import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  constructor(private auth: AuthService, private router: Router) { }

  sideBarOpen = true;

  sideBarToggler() {
    this.sideBarOpen = !this.sideBarOpen;
  }

  ngOnInit(): void {

    // User is NOT authenticated → redirect
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // User is authenticated but NOT ADMIN → reject
    if (!this.auth.hasRole('ROLE_ADMIN')) {
      this.router.navigate(['/unauthorized']);   
      return;
    }

    console.log("Admin loaded.");
  }
}
