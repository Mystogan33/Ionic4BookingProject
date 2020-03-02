import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { BookingsService } from './bookings.service';
import { Booking } from './booking.model';
import { IonList, LoadingController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {
  loadedBookings: Booking[];
  bookingSub: Subscription;
  isLoading = false;
  @ViewChild("bookingsList", {static: false}) bookingsList: IonList;

  constructor(
    private bookingsService: BookingsService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.bookingSub = this.bookingsService.bookings.subscribe(bookings => {
      this.loadedBookings = bookings;
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.bookingsService
    .fetchBookings()
    .subscribe(() => {
      this.isLoading = false;
    });
  }

  onCancelBooking(bookingId: string) {
    this.bookingsList.closeSlidingItems();

    this.loadingCtrl.create({
      message: 'Deleting booking...'
    })
    .then(loadingEl => {
      loadingEl.present();
      this.bookingsService.cancelBooking(bookingId).subscribe(async () => {
        const toast = await this.toastCtrl.create({
          message: 'Your booking have been successfully canceled.',
          duration: 3000,
          color: "success"
        });
        toast.present();
        loadingEl.dismiss();
      });
    });
  }

  ngOnDestroy() {
    if(this.bookingSub)
      this.bookingSub.unsubscribe();
  }
}
