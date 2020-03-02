import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Place } from 'src/app/places/place.model';
import { ModalController } from '@ionic/angular';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {
  @Input() selectedPlace: Place;
  @Input() selectedMode: 'selected' | 'random';
  @ViewChild('f', {static: false}) form: NgForm;
  startDate: string;
  endDate: string;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    const availableFrom = new Date(this.selectedPlace.availableFrom);
    const availableTo = new Date(this.selectedPlace.availableTo);

    if(this.selectedMode === 'random') {
      this.startDate = new Date(
          availableFrom.getTime() +
          Math.random() *
          ( availableTo.getTime() -
            7 * 24 * 60 * 60 * 1000 -
            availableFrom.getTime())
        ).toISOString();

      this.endDate = new Date(
        new Date(this.startDate)
        .getTime() +
        Math.random() *
        (
          new Date(this.startDate)
          .getTime() +
          6 *
          24 *
          3600 *
          1000 -
          new Date(this.startDate).getTime())
      ).toISOString();
    }
  }

  onCancel() {
    this.modalCtrl.dismiss(
      null,
      'cancel',
      "BookingPlaceModal"
    );
  }

  onBookPlace(form: NgForm) {
    if(!this.form.valid || !this.datesValid()) return;
    
    this.modalCtrl.dismiss(
      { bookingData: {
          firstName: this.form.value.firstName,
          lastName: this.form.value.lastName,
          guestNumber: +this.form.value.guestNumber,
          startDate: new Date(this.form.value.dateFrom),
          endDate: new Date(this.form.value.dateTo)
        }
      },
      'confirm',
      "BookingPlaceModal"
    );
  }

  datesValid() {
    const [startDate, endDate] = [new Date(this.form.value['dateFrom']), new Date(this.form.value['dateTo'])];
    return endDate > startDate;
  }
}
