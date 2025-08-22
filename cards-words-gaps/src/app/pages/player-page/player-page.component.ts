import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {MatButtonModule} from "@angular/material/button";
import {MatChipsModule} from "@angular/material/chips";
import {BehaviorSubject, Subscription} from "rxjs";
import {MatchService} from "../../service/match.service";
import {SocketService} from "../../service/socket.service";
import {Spieler} from "../../model/spieler-model";
import {Router} from "@angular/router";

@Component({
  selector: 'app-player-page',
  standalone: true,
  imports: [
    AnswerTextCardComponent,
    MatButtonModule,
    MatChipsModule,
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

  player: BehaviorSubject<Spieler> = new BehaviorSubject(new Spieler(this.playername, 1, [], [], false));
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    console.log(`Player ${this.playername} in room ${this.roomname}`);

    // Initialize the match
    this.matchService.initMatch(this.roomname);

    // Subscribe to game updates
    this.subscriptions.push(
      this.matchService.socketService.getGame().subscribe(game => {
        // Find the player in the game
        const playerInGame = game.spieler.find(spieler => spieler.name === this.playername);

        if (playerInGame) {
          console.log("Player found: " + playerInGame.name);
          this.player.next(playerInGame);

          // If this player is the catLord, redirect to catLord page
          if (playerInGame.catLord) {
            console.log("Player is catLord, redirecting to catLord page");
            this.router.navigate(['/game', this.roomname, this.playername, 'catlord']);
          }
        }

        this.matchService.game.next(game);
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
