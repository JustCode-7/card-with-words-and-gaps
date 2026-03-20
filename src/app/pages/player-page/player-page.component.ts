import {AsyncPipe, NgIf} from "@angular/common";
import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {MatButtonModule} from "@angular/material/button";
import {MatChipsModule} from "@angular/material/chips";
import {MatCardModule} from "@angular/material/card";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {BehaviorSubject, Subscription} from "rxjs";
import {MatchService} from "../../service/match.service";
import {SocketService} from "../../service/socket.service";
import {Spieler} from "../../model/spieler-model";
import {Router} from "@angular/router";
import {Game} from "../../model/game-model";

@Component({
  selector: 'app-player-page',
  imports: [
    AnswerTextCardComponent,
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    NgIf
  ],
  templateUrl: './player-page.component.html',
  styleUrl: './player-page.component.scss'
})
export class PlayerPage implements OnInit, OnDestroy {
  @Input('playername') playername!: string;
  @Input('roomname') roomname!: string;

  locked = new BehaviorSubject(false);
  matchService: MatchService = inject(MatchService);
  socketService: SocketService = inject(SocketService);
  router: Router = inject(Router);

  player: BehaviorSubject<Spieler> = new BehaviorSubject(new Spieler('', this.playername, 1, [], [], false));
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    console.log(`Player ${this.playername} in room ${this.roomname}`);

    // Initialize the match
    this.matchService.initMatch(this.roomname);

    // Subscribe to matchService.game updates (which is updated by socketService)
    const currentPlayerId = this.socketService.getPlayerId();

    this.subscriptions.push(
      this.matchService.game.subscribe((game: Game) => {
        if (!game || !game.gameHash) return;

        // Find the player in the game via ID (preferred) or Name
        const playerInGame = game.spieler.find((spieler: Spieler) =>
          spieler.id === currentPlayerId || (spieler.name === this.playername && !spieler.id)
        );

        if (playerInGame) {
          console.log("Player found in game state: " + playerInGame.name);
          this.player.next(playerInGame);

          // If this player is the catLord, redirect to catLord page
          if (playerInGame.catLord) {
            console.log("Player is catLord, redirecting to catLord page");
            this.router.navigate(['/game', this.roomname, this.playername, 'catlord']);
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getCatlord() {
    return this.matchService.game.value.spieler.find(value => value.catLord)!;
  }
}
