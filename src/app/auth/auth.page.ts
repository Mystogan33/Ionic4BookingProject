import { Component, OnInit } from '@angular/core';
import { AuthService, AuthResponseData } from './auth.service';
import { Router } from '@angular/router';
import { MenuController, LoadingController, AlertController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private menuCtrl: MenuController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
  }

  authenticate(email: string, password: string): boolean {
    this.isLoading = true;
    let isAuthSuccess = false;

    this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Logging in...'
    })
    .then(loadingEl => {
      loadingEl.present();

      let authObs: Observable<AuthResponseData>;

      authObs = this.isLogin ?
      this.authService.login(email, password) :
      this.authService.signup(email, password);

      authObs.subscribe(resData => {
        this.menuCtrl.enable(true, "m1");
        this.isLoading = false;
        loadingEl.dismiss();
        isAuthSuccess = true;
        this.router.navigateByUrl('/places/tabs/discover');
      },
      errRes => {
        if(errRes) {
          if(errRes.error.error) {
            const code = errRes.error.error.message;
            let message: string;

            switch(code) {
              case 'EMAIL_EXISTS':
                message = "This email already exists on our server.";
                break;
              case 'EMAIL_NOT_FOUND':
                message = "This email is not registered on our server.";
                break;
              case 'INVALID_PASSWORD':
                message = "Invalid credientials";
                break;
              default:
                message = "Could not sign you up, please try again.";
            }

            this.showAlert(message);
            this.isLoading = false;
            isAuthSuccess = false;
            loadingEl.dismiss();
          }
        }
      });
    });

    return isAuthSuccess;
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  onSubmit(form: NgForm) {
    if(!form.valid) {
      return;
    }

    const [email, password] = [form.value.email, form.value.password];
    const isAuthSuccess = this.authenticate(email, password);

    if(isAuthSuccess) {
      form.reset();
    }
  }

  private showAlert(message: string) {
    this.alertCtrl.create({
      header: 'Authentication failed',
      message,
      buttons: ['Okay']
    })
    .then(alertEl => alertEl.present());
  }
}
