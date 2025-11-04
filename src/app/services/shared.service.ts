import { Observable, Subject } from 'rxjs';

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private subject = new Subject<any>();

  sendClickEvent() {
    this.subject.next('54');
  }

  getClickEvent(): Observable<any> {
    return this.subject.asObservable();
  }
}