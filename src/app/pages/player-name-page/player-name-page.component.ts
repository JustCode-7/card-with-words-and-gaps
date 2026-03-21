import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {PlayerService} from "../../service/player.service";
import {SocketService} from "../../service/socket.service";
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

    const socketService = inject(SocketService);
    const answer = this.route.snapshot.queryParams['answer'];
    const storedName = localStorage.getItem('playerName');
    const isHost = socketService.isHost.value || !!socketService.getP2PRoomId();

    console.log("[DEBUG_LOG] PlayerNamePage ngOnInit. Name:", name, "Stored:", storedName, "Answer:", !!answer, "IsHost:", isHost);

    // Falls ein answer-Code vorhanden ist und der User bereits Host eines Raums ist,
    // leiten wir ihn direkt zur Raum-Erstellungs-Seite zurück, damit der Code dort verarbeitet wird.
    if (answer && isHost && (name || (storedName && storedName !== 'undefined'))) {
      console.log("[DEBUG_LOG] Host hat Antwort-Code gescannt. Leite zurück zum Raum...");
      this.router.navigate(['/new-game'], {queryParams: {answer}, queryParamsHandling: 'merge'});
      return;
    }

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
    const answer = this.route.snapshot.queryParams['answer'];

    if (offer) {
      this.router.navigate(['/join-game'], {queryParams: {offer}});
    } else {
      // Wenn wir einen Answer-Code haben, nehmen wir diesen mit zur Startseite
      this.router.navigate(['/'], {queryParams: {answer}, queryParamsHandling: 'merge'});
    }
  }
}
