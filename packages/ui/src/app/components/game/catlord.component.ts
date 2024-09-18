import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {BackendService} from "../../service/backend.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {GapCardComponent} from "./gap-card.component";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {PlayerListComponent} from "../player-list.component";

@Component({
  selector: 'app-catlord',
  standalone: true,
  imports: [
    GapCardComponent,
    MatCardModule,
    MatButtonModule,
    PlayerListComponent,
  ],
  template: `
    <app-gap-card/>

    @if (remainingPlayerCount() > 0) {
      <p>Please wait until each player has submitted their cards.</p>
    } @else {
      Everyone has selected a card, you may select a winner.
      <button mat-flat-button>Show cards</button>
    }
  `,
  styles: ``
})
export class CatlordComponent implements OnInit, OnDestroy {

  remainingPlayerCount = signal<number>(99)

  private backend = inject(BackendService)
  private route = inject(ActivatedRoute)

  private sub: Subscription | undefined

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('room')!
    this.sub = this.backend.getPlayerSubmissionStatus(roomId)
      .subscribe(players => this.remainingPlayerCount.set(players.remainingPlayerCount))

    // TODO create ws to update remaining players reactivly (create socket connection)
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe()
  }


}
