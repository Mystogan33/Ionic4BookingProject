import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { PlacesService } from '../../places.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Place } from '../../place.model';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {
  place: Place;
  placeId: string;
  form: FormGroup;
  placeSub: Subscription;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private navCtrl: NavController,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if(!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }

      this.isLoading = true;
      this.placeId = paramMap.get('placeId');

      this.placeSub = this.placesService
      .getPlace(this.placeId)
      .subscribe(place => {
        this.place = place;
        this.form = new FormGroup({
          title: new FormControl(this.place.title, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.maxLength(180)]
          }),
          description: new FormControl(this.place.description, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.maxLength(180)]
          })
        });

        this.isLoading = false;
      }, async error => {
        const alert = await this.alertCtrl.create({
          header: 'An error occured!',
          message: 'Place could not be fetched. Please try again later.',
          buttons: [{
            text: 'Okay',
            handler: () => {
              this.router.navigate(['/places/tabs/offers']);
            }
          }]
        });
        alert.present();
      });
    });
  }

  onUpdateOffer() {
    if(!this.form.valid) {
      return;
    }

    this.loadingCtrl.create({
      message: 'Updating the place...'
    })
    .then(loadingEl => {
      loadingEl.present();
      this.placesService.updatePlace(
        this.place.id,
        this.form.value.title,
        this.form.value.description
      )
      .subscribe(() => {
        loadingEl.dismiss();
        this.form.reset();
        this.router.navigate(['/places/tabs/offers']);
      });
    });
  }

  ngOnDestroy() {
    if(this.placeSub)
      this.placeSub.unsubscribe();
  }

}
