import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {MatCardModule} from "@angular/material/card";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatChipsModule} from "@angular/material/chips";
import {MatIconModule} from "@angular/material/icon";
import {MatchService} from "../../service/match.service";
import {SocketService} from "../../service/socket.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-cat-lord-page',
  standalone: true,
  imports: [
    GapTextCardComponent,
    MatCardModule,
    NgForOf,
    MatButtonModule,
    NgIf,
    AsyncPipe,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './cat-lord-page.component.html',
  styleUrl: './cat-lord-page.component.scss'
})
export class CatLordPage implements OnInit, OnDestroy {
  public catLordName: string = '';
  public roomname: string = '';

  matchService: MatchService = inject(MatchService);
  socketService: SocketService = inject(SocketService);
  isHost = false;
  private route = inject(ActivatedRoute);
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

    // Subscribe to game updates
    this.subscriptions.push(
      this.matchService.socketService.getGame().subscribe(game => {
        this.matchService.game.next(game);
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

  submitDecision() {
    // Implement decision submission logic
    console.log('Decision submitted');

    // Update the game state
    this.matchService.nextCard();
  }
}
