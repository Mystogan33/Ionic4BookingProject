import { Injectable } from '@angular/core';
import { Booking } from './booking.model';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { take, tap, map, switchMap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BookingData {
  bookedFrom: string;
  bookedTo: string;
  firstName: string;
  guestNumber: number;
  lastName: string;
  placeId: string;
  placeImage: string;
  placeTitle: string;
  userId: string;
};

@Injectable({
  providedIn: 'root'
})
export class BookingsService {
  private _bookings = new BehaviorSubject<Booking[]>([]);

  get bookings() {
    return this._bookings.asObservable();
  }
  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  addBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    guestNumber: number,
    dateFrom: Date,
    dateTo: Date
  ) {
    let generatedId: string;
    let newBooking: Booking;
    let authToken: string;

    return this.authService.token
    .pipe(
      take(1),
      switchMap(token => {
        authToken = token;
        return this.authService.userId
      }),
      take(1),
      switchMap(userId => {
        if(!userId) {
          throw new Error('No user id found');
        }
        newBooking = new Booking(
          Math.random().toString(),
          placeId,
          userId,
          placeTitle,
          placeImage,
          firstName,
          lastName,
          guestNumber,
          dateFrom,
          dateTo
        );

        return this.http
        .post<{name: string}>(
          `https://ionic4bookingproject.firebaseio.com/bookings.json?auth=${authToken}`,
          {...newBooking, id: null}
        );
      }),
      switchMap(resData => {
        generatedId = resData.name;
        return this.bookings;
      }),
      take(1),
      tap(bookings => {
        newBooking.id = generatedId;
        this._bookings.next(bookings.concat(newBooking));
      }),
      catchError(err => {
        throw new Error(err)
      })
    );
  };

  cancelBooking(bookingId: string) {
    const bookingsFilter = (booking : Booking) => booking.id !== bookingId;

    return this.authService.token
    .pipe(
      take(1),
      switchMap(token => {
        return this.http
        .delete(
          `https://ionic4bookingproject.firebaseio.com/bookings/${bookingId}.json?auth=${token}`
        )
      }),
      switchMap(() => {
        return this.bookings;
      }),
      take(1),
      tap(bookings => {
        this._bookings.next(bookings.filter(bookingsFilter));
      }),
      catchError(err => {
        throw new Error(err)
      })
    );
  };

  fetchBookings() {
    let authToken: string;

    return this.authService.token
    .pipe(
      take(1),
      switchMap(token => {
        authToken = token;
        return this.authService.userId
      }),
      take(1),
      switchMap(userId => {
        if(!userId) throw new Error('User not found!');
        return this.http
        .get<{ [key: string] : BookingData }>(
          `https://ionic4bookingproject.firebaseio.com/bookings.json?auth=${authToken}&orderBy="userId"&equalTo="${userId}"`
        );
      }),
      map(bookingData => {
        const bookings = [];
        for(const key in bookingData) {
          if(bookingData.hasOwnProperty(key)) {
            bookings.push(new Booking(
              key,
              bookingData[key].placeId,
              bookingData[key].userId,
              bookingData[key].placeTitle,
              bookingData[key].placeImage,
              bookingData[key].firstName,
              bookingData[key].lastName,
              bookingData[key].guestNumber,
              new Date(bookingData[key].bookedFrom),
              new Date(bookingData[key].bookedTo)
            ))
          }
        }
        return bookings;
      }),
      tap(bookings => this._bookings.next(bookings)),
      catchError(err => {
        throw new Error(err)
      })
    );
  };
}
