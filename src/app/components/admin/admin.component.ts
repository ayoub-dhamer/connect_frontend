import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
 constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  sideBarOpen = true;

  sideBarToggler() {
    this.sideBarOpen = !this.sideBarOpen;
  }

  ngOnInit(): void {
    console.log(this.authService.getToken());
    var token = this.authService.getToken();
      if (token) {
          console.log(token);
      } else {
        this.router.navigate(['/login']);
      }
  }
}
