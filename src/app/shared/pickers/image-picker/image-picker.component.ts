import { Component, OnInit, Output, EventEmitter, ElementRef, ViewChild, Input } from '@angular/core';
import { Plugins, Capacitor, CameraSource, CameraResultType } from '@capacitor/core';
import { Platform, ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {
  @ViewChild('filePicker', {static: false}) filePickerRef: ElementRef<HTMLInputElement>;

  @Output() imagePicked = new EventEmitter<string | File>();
  @Input() showPreview = false;
  selectedImage: any;
  usePicker = false;

  constructor(
    private platform: Platform,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    if(
      (this.platform.is('mobile') && !this.platform.is('hybrid')) ||
      (this.platform.is('desktop'))
    ) {
      this.usePicker = true;
    }
  }

  onPickImage() {
    if(!Capacitor.isPluginAvailable('Camera')) {
      this.chooseFromGallery();
      return;
    } else {
      Plugins.Camera.getPhoto({
        quality: 50,
        source: CameraSource.Prompt,
        width: 600,
        correctOrientation: true,
        resultType: CameraResultType.Base64,
      })
      .then(image => {
        this.selectedImage = "data:image/jpeg;base64," +image.base64String;
        this.imagePicked.emit(this.selectedImage);
      })
      .catch(error => {
        this.usePicker = true;
        this.toastCtrl.create({
          message: 'No camera found, choose a file instead.',
          color: 'danger',
          translucent: true,
          buttons: [
            {
              text: 'Choose from gallery',
              handler: () => {
                this.chooseFromGallery();
              },
              role: 'confirm'
            }, {
              text: 'cancel',
              role: 'cancel',
            }
          ]
        })
        .then(toastEl => toastEl.present());
        return;
      })
    }
  }

  chooseFromGallery() {
    this.filePickerRef.nativeElement.click();
  }

  onFileChosen(event: Event) {
    const pickedFile = (event.target as HTMLInputElement).files[0];
    if(!pickedFile) {
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = fr.result.toString();
      this.selectedImage = dataUrl;
      this.imagePicked.emit(pickedFile);
    }
    fr.readAsDataURL(pickedFile);
  }

}
