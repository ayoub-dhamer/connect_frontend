import { Component, OnInit } from '@angular/core';
import { CallSignalService } from '../../services/call-signal.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-call-overlay',
  templateUrl: './call-overlay.component.html',
  styleUrls: ['./call-overlay.component.css'],
})
export class CallOverlayComponent implements OnInit {
  constructor(
    public callSignal: CallSignalService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.auth.loadUser().subscribe((user) => {
      if (user) this.callSignal.init(user.email, user.name);
    });
  }
}
