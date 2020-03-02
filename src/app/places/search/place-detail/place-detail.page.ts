import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, ModalController, ActionSheetController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from '../../places.service';
import { Place } from '../../place.model';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { Subscription } from 'rxjs';
import { BookingsService } from 'src/app/bookings/bookings.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MapModalComponent } from 'src/app/shared/map-modal/map-modal.component';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  placeId: string;
  placeSub: Subscription;
  isBookable = false;
  isLoading = false;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private router: Router,
    private placesService: PlacesService,
    private bookingService: BookingsService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if(!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/discover');
        return;
      }

      this.isLoading = true;
      let fetchedUserId: string;
      this.authService.userId
      .pipe(
        take(1),
        switchMap(userId => {
          if(!userId) {
            throw new Error('Found no user!');
          }
          fetchedUserId = userId;
          return this.placesService
          .getPlace(paramMap.get('placeId'))
        })
      )
      .subscribe(place => {
        this.place = place;
        this.isBookable = place.userId !== fetchedUserId;
        this.isLoading = false;
      }, async error => {
        const alert = await this.alertCtrl.create({
          header: 'An error occured!',
          message: 'Place could not be fetched. Please try again later.',
          buttons: [{
            text: 'Okay',
            handler: () => {
              this.router.navigate(['/places/tabs/discover']);
            }
          }]
        });
        alert.present();
      });
    });
  }

  onBookPlace() {

    this.actionSheetCtrl.create({
      header: 'Choose an Action',
      buttons: [
        {
          text: 'Select Date',
          role: 'confirm',
          handler: () => {
            this.openBookingModal('select')
          }
        },
        {
          text: 'Random Date',
          role: 'confirm',
          handler: () => {
            this.openBookingModal('random')
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    })
    .then(actionsheet => {
      actionsheet.present();
    });
  }

  async openBookingModal(mode: 'select' | 'random') {

    const modal = await this.modalCtrl.create({
      component: CreateBookingComponent,
      componentProps: {
        selectedPlace: this.place,
        selectedMode: mode
      },
      id: "BookingPlaceModal"
    });

    modal.present();

    modal.onDidDismiss()
    .then(resultData => {
      if(resultData.role === 'confirm') {
        this.loadingCtrl.create({
          message: 'Add booking...'
        })
        .then(loadingEl => {
          loadingEl.present();
          const booking = resultData.data.bookingData;
          this.bookingService
          .addBooking(
            this.place.id,
            this.place.title,
            this.place.imageUrl,
            booking.firstName,
            booking.lastName,
            booking.guestNumber,
            booking.startDate,
            booking.endDate
          )
          .subscribe(() => {
            this.toastCtrl.create({
              message: 'Your booking have been successfully added.',
              duration: 3000,
              color: "success"
            })
            .then(toastEl => {
              toastEl.present();
              loadingEl.dismiss();
            })
          });
        });
      }
    });
  }

  async onShowFullMap() {
    const modal = await this.modalCtrl.create({
      component: MapModalComponent,
      componentProps: {
        center: {
          lat: this.place.location.lat,
          lng: this.place.location.lng
        },
        selectable: false,
        closeButtonText: 'Close',
        title: this.place.location.address
      }
    });

    modal.present();
  }

  ngOnDestroy() {
    if(this.placeSub)
    this.placeSub.unsubscribe();
  }

}
