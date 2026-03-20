import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {PlayerService} from "../../service/player.service";
import {MatIconModule} from "@angular/material/icon";
import {Router} from "@angular/router";
import {WebRTCService} from "../../service/webrtc.service";

@Component({
  selector: 'app-player-name-page',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './player-name-page.component.html',
  styles: `
    .qr-container {
      margin-top: 1rem;
    }

    .w-100 {
      width: 100%;
    }

    .mt-4 {
      margin-top: 1.5rem;
    }

    .py-4 {
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
    }
  `
})
export class PlayerNamePage implements OnInit {
  appQrCodeUrl = signal('');
  form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(32)]),
  })
  private playerService = inject(PlayerService);
  private webrtcService = inject(WebRTCService);
  private router = inject(Router);

  async ngOnInit() {
    const {name} = this.playerService.getPlayer();
    this.form.patchValue({name});

    // QR-Code für die App-URL generieren
    const appUrl = 'https://justcode-7.github.io/card-with-words-and-gaps/';
    const qr = await this.webrtcService.generateQRCode(appUrl);
    this.appQrCodeUrl.set(qr);
  }

  onSubmit() {
    const {name} = this.form.value;
    this.playerService.setName(name);

    this.router.navigate(['/join-game'])
  }
}
