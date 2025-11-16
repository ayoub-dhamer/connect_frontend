import { Component, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service'; // adjust path

@Component({
  selector: 'app-side-nav-bar',
  templateUrl: './side-nav-bar.component.html',
  styleUrls: ['./side-nav-bar.component.scss']
})
export class SideNavBarComponent implements OnInit {

  isExpanded = true;

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

constructor(private translate: TranslateService, private auth: AuthService) {
  this.translate.setDefaultLang('en');
}

switchLang(lang: string) {
  this.translate.use(lang);
}

 userRoles: string[] = [];

 menu: any[] = [
    {
      label: 'dashboardLabel',
      icon: 'dashboard',
      link: '/admin',
      roles: ['ROLE_ADMIN']
    },
    {
      label: 'usersLabel',
      icon: 'group',
      link: '/admin/users',
      roles: ['ROLE_ADMIN']
    },
    {
      label: 'My Tasks',
      icon: 'task',
      link: '/user/tasks',
      roles: ['ROLE_USER']
    },
    {
      label: 'projectsLabel',
      icon: 'folder',
      link: '/user/projects',
      roles: ['ROLE_USER']
    }
  ];

   ngOnInit() {
    this.userRoles = this.auth.getRoles(); 
  }

  canShow(item: any): boolean {
    return item.roles.some((role: any) => this.userRoles.includes(role));
  }

}
