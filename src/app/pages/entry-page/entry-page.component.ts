import {Component, inject, OnInit} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {MatchService} from "../../service/match.service";
import {PlayerService} from "../../service/player.service";
import {SocketService} from "../../service/socket.service";

@Component({
  selector: 'app-entry-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './entry-page.component.html',
  styleUrl: './entry-page.component.scss'
})
export class EntryPageComponent implements OnInit {
  protected readonly MatchService = MatchService;
  private playerService = inject(PlayerService);
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    const player = this.playerService.getPlayer();
    // Parameter können vor oder nach dem Hash stehen
    const answer = this.route.snapshot.queryParams['answer'] || this.getQueryParamFromUrl('answer');

    // Host-Erkennung über SocketService (Signal ist bereits mit localStorage initialisiert)
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
    if (answer && (isHost || storedRoom)) {
      console.log("[DEBUG_LOG] Host auf EntryPage mit Antwort-Code. Leite zu /new-game...");
      this.router.navigate(['/new-game'], {queryParams: {answer}, queryParamsHandling: 'merge'});
      return;
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
