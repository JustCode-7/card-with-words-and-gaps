import {Component, effect, inject, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {MatButtonModule} from "@angular/material/button";
import {MatChipsModule} from "@angular/material/chips";
import {MatCardModule} from "@angular/material/card";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {Subscription} from "rxjs";
import {MatchService} from "../../service/match.service";
import {SocketService} from "../../service/socket.service";
import {Spieler} from "../../model/spieler-model";
import {Router} from "@angular/router";
import {MatListModule} from "@angular/material/list";
import {MatIconModule} from "@angular/material/icon";
import {CommonModule} from "@angular/common";
import {NextCzarPipe} from "../cat-lord-page/cat-lord-page.component";

@Component({
  selector: 'app-player-page',
  imports: [
    AnswerTextCardComponent,
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    CommonModule,
    NextCzarPipe
  ],
  templateUrl: './player-page.component.html',
  styleUrl: './player-page.component.scss'
})
export class PlayerPage implements OnInit, OnDestroy {
  @Input('playername') playername!: string;
  @Input('roomname') roomname!: string;

  locked = signal(false);
  matchService: MatchService = inject(MatchService);
  socketService: SocketService = inject(SocketService);
  router: Router = inject(Router);

  player = signal<Spieler>(new Spieler('', this.playername, 1, [], [], false));
  private subscriptions: Subscription[] = [];

  constructor() {
    effect(() => {
      const game = this.matchService.game();
      if (!game || !game.gameHash || game.isEnded) return;

      const currentPlayerId = this.socketService.getPlayerId();

      // Find the player in the game via ID (preferred) or Name
      const playerInGame = game.spieler.find((spieler: Spieler) =>
        spieler.id === currentPlayerId || (spieler.name === this.playername && !spieler.id)
      );

      if (playerInGame) {
        console.log("Player found in game state: " + playerInGame.name);
        this.player.set(playerInGame);

        // If this player is the catLord, redirect to catLord page
        if (playerInGame.catLord) {
          console.log("Player is catLord, redirecting to catLord page");
          this.router.navigate(['/game', this.roomname, this.playername, 'catlord']);
        }
      }
    });
  }

  ngOnInit(): void {
    console.log(`Player ${this.playername} in room ${this.roomname}`);

    // Initialize the match
    this.matchService.initMatch(this.roomname);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getCatlord() {
    return this.matchService.game().spieler.find(value => value.catLord)!;
  }
}
