import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, switchMap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: GoogleMaps.PlaceLocation;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([]);

  get places() {
    return this._places.asObservable();
  }

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  fetchPlaces() {
    return this.authService.token
    .pipe(
      take(1),
      switchMap(token => {
        return this.http
        .get<{ [key: string]: PlaceData }>(
          `https://ionic4bookingproject.firebaseio.com/offered-places.json?auth=${token}`
        )
      }),
      map(resData => {
        const places = [];
        for(const key in resData) {
          if(resData.hasOwnProperty(key)) {
            places.push(new Place(
              key,
              resData[key].title,
              resData[key].description,
              resData[key].imageUrl,
              resData[key].price,
              new Date(resData[key].availableFrom),
              new Date(resData[key].availableTo),
              resData[key].userId,
              resData[key].location
            ));
          }
        }
        return places;
      }),
      tap(places => this._places.next(places)),
      catchError(err => {
        throw new Error(err)
      })
    );
  };

  getPlace(placeId: string) {
    return this.authService.token
    .pipe(
      take(1),
      switchMap(token => {
        return this.http.get<PlaceData>(
          `https://ionic4bookingproject.firebaseio.com/offered-places/${placeId}.json?auth=${token}`
        )
      }),
      map(placeData => {
        return new Place(
          placeId,
          placeData.title,
          placeData.description,
          placeData.imageUrl,
          placeData.price,
          new Date(placeData.availableFrom),
          new Date(placeData.availableTo),
          placeData.userId,
          placeData.location
        );
      }),
      catchError(err => {
        throw new Error(err)
      })
    );
  };

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    location: GoogleMaps.PlaceLocation,
    imageUrl: string
  ) {
    let backendId: string;
    let newPlace: Place;
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
        if(!userId) throw new Error('No user found!');

        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          imageUrl,
          price,
          dateFrom,
          dateTo,
          userId,
          location
        );

        return this.http
        .post<{name: string}>(
          `https://ionic4bookingproject.firebaseio.com/offered-places.json?auth=${authToken}`,
          { ...newPlace, id: null }
        )
      }),
      switchMap(resData => {
        backendId = resData.name;
        return this.places;
      }),
      take(1),
      tap(places => {
        newPlace.id = backendId;
        this._places.next(places.concat(newPlace));
      }),
      catchError(err => {
        throw new Error(err)
      })
    );
  };

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    let authToken: string;

    return this.authService.token
    .pipe(
      take(1),
      switchMap(token => {
        authToken = token;
        return this.places
      }),
      take(1),
      switchMap(places => {
        if(!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap(places => {
        const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );
        return this.http.put(
          `https://ionic4bookingproject.firebaseio.com/offered-places/${placeId}.json?auth=${authToken}`,
          {...updatedPlaces[updatedPlaceIndex], id: null}
        );
      }),
      tap(() => this._places.next(updatedPlaces)),
      catchError(err => {
        throw new Error(err)
      })
    );
  };

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);

    return this.authService.token
    .pipe(
      take(1),
      switchMap(token => {
        return this.http.post<{imageUrl: string, imagePath: string}>(
          'https://us-central1-ionic4bookingproject.cloudfunctions.net/storeImage',
          uploadData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }),
      catchError(err => {
        throw new Error(err)
      })
    );
  }
}
