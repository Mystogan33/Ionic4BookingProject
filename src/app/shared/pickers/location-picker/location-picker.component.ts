import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { Plugins, Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @Output()
  locationPicked = new EventEmitter<GoogleMaps.PlaceLocation>();
  @Input() showPreview = false;


  pickedLocation: GoogleMaps.PlaceLocation;
  isLoading = false;
  selectedLocationImage: string;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {}

  async onPickLocation() {

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Please Choose',
      buttons: [
        {
          text: 'Auto-Locate',
          handler: () => this.locateUser(),
          role: 'confirm'
        },
        {
          text: 'Pick On Map',
          handler: () => this.openMap(),
          role: 'confirm'
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    actionSheet.present();
  }

  private locateUser() {
    if(!Capacitor.isPluginAvailable('Geolocation')) {
      this.showErrorAlert();
      return;
    }

    Plugins.Geolocation.getCurrentPosition()
    .then(geoPosition => {
      const coordinates: GoogleMaps.Coordinates = {
        lat: geoPosition.coords.latitude,
        lng: geoPosition.coords.longitude
      };
      this.createPlace(coordinates);
    })
    .catch(err => this.showErrorAlert());
  }

  private async showErrorAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Could not fetch location',
      message: 'Please use the map to pick a location.',
      buttons: ['Okay']
    });

    alert.present();
  }

  private async openMap() {
    const modal = await this.modalCtrl.create({
      component: MapModalComponent
    });

    modal.onDidDismiss().then((modalData: {data: GoogleMaps.Coordinates, role: string}) => {
      if(modalData.role === 'confirm' && modalData.data)
        this.createPlace(modalData.data);
      else
        return;
    });

    modal.present();
  }

  private createPlace(coordinates: GoogleMaps.Coordinates) {

    this.pickedLocation = {
      ...coordinates,
      address: null,
      staticMapImageUrl: null
    };

    this.isLoading = true;
    this.getAddress(coordinates)
    .pipe(
      switchMap(address => {
        this.pickedLocation.address = address;
        return of(this.getMapImage(this.pickedLocation, 14))
      })
    )
    .subscribe(staticMapImageUrl => {
      this.pickedLocation.staticMapImageUrl = staticMapImageUrl;
      this.selectedLocationImage = staticMapImageUrl;
      this.isLoading = false;
      this.locationPicked.emit(this.pickedLocation);
    });
  }

  private getAddress(coords: GoogleMaps.Coordinates) {
    return this.http
    .get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${environment.gcp_maps_places}`
    )
    .pipe(
      map((geoData: any) => {
        if(!geoData || !geoData.results || geoData.results.length === 0) {
          return null;
        } else {
          return geoData.results[0].formatted_address
        }
      })
    );
  }

  private getMapImage(coords: GoogleMaps.Coordinates, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=${zoom}&size=500x300&maptype=roadmap&markers=color:red%7Clabel:Place%7C${coords.lat},${coords.lng}&key=${environment.gcp_maps_places}`;
  }

}
