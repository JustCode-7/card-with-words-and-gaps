import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterOutlet} from '@angular/router';
import {MatButtonModule} from "@angular/material/button";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatchService} from "./service/match.service";
import {SocketService} from "./service/socket.service";
import {PwaInstallService} from "./service/pwa-install.service";
import {UpdateService} from "./service/update.service";

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  matchService = inject(MatchService);
  socketService = inject(SocketService);
  router = inject(Router);
  pwa = inject(PwaInstallService);
  updateService = inject(UpdateService);

  ngOnInit() {
    // Die PWA-Logik und Update-Prüfungen werden automatisch in den Konstruktoren
    // der injizierten Services (PwaInstallService, UpdateService) gestartet.
    console.log('[App] Initialisierung abgeschlossen. PWA-Services aktiv.');
  }

  goToMainMenu() {
    this.router.navigate(['/']);
  }

  endGame() {
    this.matchService.endGame();
  }
}
