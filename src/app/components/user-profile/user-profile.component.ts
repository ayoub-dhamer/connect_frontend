import { Component } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {

  editMode = false;

  // --- Real user data ---
  user = {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "(239) 816-9029",
    address: "San Francisco, CA",
    role: "Full Stack Developer",
    location: "USA"
  };

  // --- Temporary editable copy ---
  editableUser: any = {};

  enableEdit() {
    this.editMode = true;
    this.editableUser = { ...this.user }; // clone object
  }

  cancelEdit() {
    this.editMode = false;
  }

  saveChanges() {
    // Here you call your API service to save user data
    // this.userService.updateUser(this.editableUser).subscribe(...)

    this.user = { ...this.editableUser }; // apply changes
    this.editMode = false;
  }
}
