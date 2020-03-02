import { Component, OnInit, OnDestroy,  } from '@angular/core';

import { Platform, MenuController } from '@ionic/angular';
import { Plugins, Capacitor, AppState } from '@capacitor/core';

import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private subManager = new Subject<boolean>();
  private previousAuthState = false;

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router,
    private menuCtrl: MenuController
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    this.authService.userIsAuthenticated
    .pipe(takeUntil(this.subManager))
    .subscribe(isAuthenticated => {
      this.menuCtrl.enable(isAuthenticated, "m1");
      if(!isAuthenticated && this.previousAuthState !== isAuthenticated) {
        this.router.navigateByUrl('/auth');
      }
      this.previousAuthState = isAuthenticated;
    });

    Plugins.App.addListener('appStateChange', this.checkAuthOnResume.bind(this));
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if(Capacitor.isPluginAvailable('SplashScreen'))
        Plugins.SplashScreen.hide();
    });
  }

  onLogout() {
    this.authService.logout();
  }

  private checkAuthOnResume(state: AppState) {
    if(state.isActive) {
      this.authService
      .autoLogin()
      .pipe(take(1))
      .subscribe(success => {
        if(!success) {
          this.onLogout();
        }
      });
    }
  }

  ngOnDestroy() {
    this.subManager.next(true);
    this.subManager.complete();
  }
}
