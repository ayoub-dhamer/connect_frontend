import { Component } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent {
  editMode = false;
  showToast = false;

  user = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '(239) 816-9029',
    address: 'San Francisco, CA',
    role: 'Full Stack Developer',
    location: 'USA',
  };

  editableUser: any = {};

  enableEdit() {
    this.editableUser = { ...this.user };
    this.editMode = true;
  }

  cancelEdit() {
    this.editMode = false;
  }

  saveChanges() {
    this.user = { ...this.editableUser };
    this.editMode = false;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 2800);
  }
}
