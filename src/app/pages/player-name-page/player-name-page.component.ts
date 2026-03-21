import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {PlayerService} from "../../service/player.service";
import {MatIconModule} from "@angular/material/icon";
import {ActivatedRoute, Router} from "@angular/router";
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
  templateUrl: './player-name-page.component.html'
})
export class PlayerNamePage implements OnInit {
  appQrCodeUrl = signal('');
  form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(32)]),
  })
  private playerService = inject(PlayerService);
  private webrtcService = inject(WebRTCService);
  private router = inject(Router);

  private route = inject(ActivatedRoute);

  async ngOnInit() {
    const {name} = this.playerService.getPlayer();
    this.form.patchValue({name});

    // Falls wir von einem Join-Link kommen, behalten wir die Parameter für nachher
    const offer = this.route.snapshot.queryParams['offer'];
    if (offer) {
      console.log("[DEBUG_LOG] Startseite mit Offer-Code aufgerufen:", offer);
    }

    // QR-Code für die App-URL generieren
    const appUrl = 'https://justcode-7.github.io/card-with-words-and-gaps/';
    const qr = await this.webrtcService.generateQRCode(appUrl);
    this.appQrCodeUrl.set(qr);
  }

  onSubmit() {
    const {name} = this.form.value;
    this.playerService.setName(name);

    // Falls ein Offer-Code vorhanden war, leiten wir direkt zurück zum Join
    const offer = this.route.snapshot.queryParams['offer'];
    if (offer) {
      this.router.navigate(['/join-game'], {queryParams: {offer}});
    } else {
      this.router.navigate(['/join-game']);
    }
  }
}
