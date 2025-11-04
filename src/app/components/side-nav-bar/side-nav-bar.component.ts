import { Component } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-side-nav-bar',
  templateUrl: './side-nav-bar.component.html',
  styleUrls: ['./side-nav-bar.component.scss']
})
export class SideNavBarComponent {

constructor(private translate: TranslateService) {
  this.translate.setDefaultLang('en');
}

switchLang(lang: string) {
  this.translate.use(lang);
}

}
