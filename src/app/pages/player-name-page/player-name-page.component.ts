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
    // Parameter können vor oder nach dem Hash stehen
    const answer = this.route.snapshot.queryParams['answer'] || this.getQueryParamFromUrl('answer');
    const storedName = localStorage.getItem('playerName');
    const storedIsHost = localStorage.getItem('isHost') === 'true';
    const storedRoom = localStorage.getItem('currentP2PRoomId');
    const isHost = storedIsHost || socketService.isHost.value || !!socketService.getP2PRoomId();

    console.log("[DEBUG_LOG] PlayerNamePage ngOnInit. Name:", name, "StoredName:", storedName, "Answer:", !!answer, "IsHost:", isHost, "StoredRoom:", storedRoom);

    // Falls ein answer-Parameter vorhanden ist, erzwingen wir die Host-Wiederherstellung,
    // falls wir im localStorage Daten finden.
    if (answer && !isHost && storedRoom) {
      console.warn("[DEBUG_LOG] PlayerNamePage: Answer parameter detected but isHost is false. Restoring host status.");
      socketService.isHost.next(true);
      socketService.setP2PRoomId(storedRoom);
    }
    if (!isHost && !storedRoom && answer) {
      console.warn("[DEBUG_LOG] Guest in PlayerNamePage with answer parameter! LocalStorage might be empty.");
    }

    // Falls ein answer-Code vorhanden ist und der User bereits Host eines Raums ist,
    // leiten wir ihn direkt zur Raum-Erstellungs-Seite zurück, damit der Code dort verarbeitet wird.
    const effectiveName = name || (storedName && storedName !== 'undefined' && storedName !== '');
    if (answer && (isHost || storedRoom || socketService.isHost.value) && effectiveName) {
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
    const offer = this.route.snapshot.queryParams['offer'] || this.getQueryParamFromUrl('offer');
    const answer = this.route.snapshot.queryParams['answer'] || this.getQueryParamFromUrl('answer');

    console.log("[DEBUG_LOG] PlayerNamePage: Name set to", name, "Answer present:", !!answer, "Offer present:", !!offer);

    if (offer) {
      this.router.navigate(['/join-game'], {queryParams: {offer}});
    } else if (answer) {
      // Wenn wir einen Answer-Code haben und Host sind (via localStorage), direkt zum Raum
      const isHost = localStorage.getItem('isHost') === 'true';
      if (isHost) {
        this.router.navigate(['/new-game'], {queryParams: {answer}, queryParamsHandling: 'merge'});
      } else {
        this.router.navigate(['/'], {queryParams: {answer}, queryParamsHandling: 'merge'});
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  private getQueryParamFromUrl(name: string): string | null {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get(name);
    } catch (e) {
      return null;
    }
  }
}
