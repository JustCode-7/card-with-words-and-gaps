import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterOutlet} from '@angular/router';
import {MatButtonModule} from "@angular/material/button";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatchService} from "./service/match.service";
import {SocketService} from "./service/socket.service";

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
export class AppComponent {
  matchService = inject(MatchService);
  socketService = inject(SocketService);
  router = inject(Router);

  goToMainMenu() {
    this.router.navigate(['/']);
  }

  endGame() {
    this.matchService.endGame();
  }
}
