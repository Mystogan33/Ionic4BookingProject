import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit, OnDestroy {
  loadedPlaces: Place[];
  listedLoadedPlaces: Place[];
  relevantPlaces: Place[];
  placesSub: Subscription;

  isLoading = false;
  filter = "all";

  constructor(
    private placesService: PlacesService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.placesSub = this.placesService.places
    .subscribe(places => {
      this.loadedPlaces = places;
      this.onFilterUpdate(this.filter);
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;

    this.placesService
    .fetchPlaces()
    .subscribe(() => {
      this.isLoading = false;
    });
  }

  onFilterUpdate(filter: string) {
    this.authService.userId
    .pipe(
      take(1)
    )
    .subscribe(userId => {
      const isShown = (place => filter === 'all' || place.userId !== userId);
      this.relevantPlaces = this.loadedPlaces.filter(isShown);
      this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      this.filter = filter;
    });
  }

  ngOnDestroy() {
    if(this.placesSub)
      this.placesSub.unsubscribe();
  }

}
