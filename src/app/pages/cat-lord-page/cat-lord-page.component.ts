import {Component, inject, OnDestroy, OnInit, Pipe, PipeTransform} from '@angular/core';
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {MatCardModule} from "@angular/material/card";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatChipsModule} from "@angular/material/chips";
import {MatIconModule} from "@angular/material/icon";
import {SocketService} from "../../service/socket.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";

import {MatListModule} from "@angular/material/list";
import {MatchService} from "../../service/match.service";
import {Game} from "../../model/game-model";
import {Spieler} from "../../model/spieler-model";

@Pipe({
  name: 'nextCzar',
  standalone: true
})
export class NextCzarPipe implements PipeTransform {
  transform(spieler: Spieler[] | undefined): Spieler | undefined {
    if (!spieler) return undefined;
    // The match service logic: if round is finished, the winner has the points incremented
    // and we stored winnerOfLastRound but that's not easily accessible here.
    // However, the player who will be catLord next is either marked or we can find who just got a point?
    // Let's use the simplest logic: find someone who is NOT current catLord but will be? No.
    // Let's just pass the whole game state if needed.
    // Actually, I'll change the pipe to find the winner based on points or a specific property.
    return spieler.find(s => (s as any).isWinner);
  }
}

@Component({
  selector: 'app-cat-lord-page',
  imports: [
    GapTextCardComponent,
    MatCardModule,
    NgForOf,
    MatButtonModule,
    NgIf,
    MatChipsModule,
    MatIconModule,
    MatListModule,
    AsyncPipe,
    NextCzarPipe
  ],
  templateUrl: './cat-lord-page.component.html',
  styleUrl: './cat-lord-page.component.scss'
})
export class CatLordPage implements OnInit, OnDestroy {
  public catLordName: string = '';
  public roomname: string = '';

  matchService: MatchService = inject(MatchService);
  socketService: SocketService = inject(SocketService);
  game$ = this.matchService.game.asObservable();
  isHost = false;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Extract route parameters
    this.route.paramMap.subscribe(params => {
      this.roomname = params.get('roomname') || '';
      this.catLordName = params.get('playername') || '';

      console.log(`CatLord ${this.catLordName} in room ${this.roomname}`);

      // Check if this player is the host
      this.isHost = this.socketService.isHost.value;

      // Initialize the match
      this.matchService.initMatch(this.roomname);
    });

    // Subscribe to matchService.game updates
    this.subscriptions.push(
      this.matchService.game.subscribe((game: Game) => {
        if (!game || !game.gameHash) return;

        // Find this player in the game
        const playerInGame = game.spieler.find((s: Spieler) => s.name === this.catLordName);
        if (playerInGame && !playerInGame.catLord) {
          console.log("No longer CatLord, redirecting to player page");
          this.router.navigate(['/game', this.roomname, this.catLordName, 'player']);
        }
      })
    );

    // Subscribe to host status changes
    this.subscriptions.push(
      this.socketService.isHost.subscribe(isHost => {
        this.isHost = isHost;
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getShuffledSubmittedAnswers() {
    const game = this.matchService.game.value;
    const submitted = game.spieler
      .filter((s: Spieler) => !s.catLord && s.ready && s.selectedCards.length > 0)
      .map((s: Spieler) => ({
        name: s.name,
        cards: s.selectedCards,
        fullText: this.buildFullText(game.currentCatlordCard, s.selectedCards)
      }));

    return this.shuffle(submitted);
  }

  submitDecision() {
    // Only used if we want to proceed to next round manually
    this.matchService.nextRound();
  }

  pickWinner(winnerName: string) {
    this.matchService.selectWinner(winnerName);
  }

  revealAnswers() {
    this.matchService.revealAnswers();
  }

  private buildFullText(gapText: string, answers: string[]): string {
    let result = gapText;
    answers.forEach(answer => {
      if (gapText.includes('___')) {
        result = result.replace('___', `[${answer}]`);
      } else {
        result = result.concat(` [${answer}]`);
      }

    });
    return result;
  }

  private shuffle(array: any[]) {
    if (!array) return [];
    let shuffled = [...array];
    let currentIndex = shuffled.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [
        shuffled[randomIndex], shuffled[currentIndex]];
    }
    return shuffled;
  }
}
