import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {MatchService} from "../../service/match.service";
import {PlayerService} from "../../service/player.service";
import {SocketService} from "../../service/socket.service";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";

@Component({
  selector: 'app-entry-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './entry-page.component.html',
  styleUrl: './entry-page.component.scss'
})
export class EntryPageComponent implements OnInit {
  nameControl = new FormControl('', [Validators.required, Validators.maxLength(32)]);
  isEditing = signal(false);
  protected readonly MatchService = MatchService;
  private playerService = inject(PlayerService);
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    const player = this.playerService.getPlayer();
    this.nameControl.setValue(player.name);

    effect(() => {
      const player = this.playerService.getPlayer();
      this.nameControl.setValue(player.name);
    });
  }

  ngOnInit(): void {
    const player = this.playerService.getPlayer();
    // Parameter können vor oder nach dem Hash stehen
    const answer = this.route.snapshot.queryParams['answer'] || this.getQueryParamFromUrl('answer');

    // Host-Erkennung über SocketService
    const isHost = this.socketService.isHost();
    const storedRoom = this.socketService.getP2PRoomId();

    console.log("[DEBUG_LOG] EntryPage ngOnInit. Player:", player.name, "Answer present:", !!answer, "IsHost:", isHost, "StoredRoom:", storedRoom);

    // Falls ein Name fehlt, zur Namenseingabe leiten, dabei Parameter behalten
    if (!player.name || player.name === 'undefined' || player.name.trim() === '') {
      console.log("[DEBUG_LOG] Name missing. Redirecting to /set-name");
      this.router.navigate(['/set-name'], {queryParams: {answer}, queryParamsHandling: 'merge'});
      return;
    }

    // Wenn der User bereits Host eines aktiven Raums ist und einen Antwort-Code scannt,
    // leiten wir ihn direkt zu seiner Raum-Erstellungs-Seite zurück.
    // Wichtig: Nur wenn er WIRKLICH Host ist, nicht wenn er nur einen storedRoom hat.
    if (answer && isHost) {
      console.log("[DEBUG_LOG] Host auf EntryPage mit Antwort-Code. Leite zu /new-game...");
      this.router.navigate(['/new-game'], {queryParams: {answer}, queryParamsHandling: 'merge'});
      return;
    }
  }

  saveName() {
    if (this.nameControl.valid && this.nameControl.value) {
      this.playerService.setName(this.nameControl.value);
      this.isEditing.set(false);
    }
  }

  toggleEdit() {
    this.isEditing.update(v => !v);
    if (!this.isEditing()) {
      const player = this.playerService.getPlayer();
      this.nameControl.setValue(player.name);
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
