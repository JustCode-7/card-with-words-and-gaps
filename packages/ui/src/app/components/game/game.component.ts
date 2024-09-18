import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {BackendService} from "../../service/backend.service";
import {UserService} from "../../service/user.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {MatCardModule} from "@angular/material/card";
import {CatlordComponent} from "./catlord.component";
import {Player} from "@cards-with-words-and-gaps/shared/dist/model/player";
import {PlayerComponent} from "./player.component";
import {GapCardComponent} from "./gap-card.component";
import {Card} from "@cards-with-words-and-gaps/shared/dist/model/card";
import {GamePlayerListComponent} from "./game-player-list.component";

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    MatCardModule,
    CatlordComponent,
    PlayerComponent,
    GapCardComponent,
    GamePlayerListComponent,
  ],
  template: `
    <!--    <mat-card appearance="outlined">-->
    <!--      <mat-card-content>-->
    <!--        @if (isCatlord()) {-->
    <!--          You are the the catlord. 🐱-->
    <!--        } @else {-->
    <!--          The Catlord is {{ catlord().name }}-->
    <!--        }-->
    <!--      </mat-card-content>-->
    <!--    </mat-card>-->

    @if (isCatlord()) {
      <app-catlord/>
    } @else {
      <app-player/>
    }

    <app-game-player-list [catlord]="catlord()"/>

  `,
  styles: ``
})
export class GameComponent implements OnInit, OnDestroy {

  gapCard = signal<Card>({id: '', text: ''})
  catlord = signal<Player>({id: '', name: ''})
  isCatlord = computed<boolean>(() => this.catlord().id == this.user.getUser().id)

  private backend = inject(BackendService)
  private user = inject(UserService)
  private route = inject(ActivatedRoute)

  private sub: Subscription[] = []

  ngOnInit(): void {

    const roomId = this.route.snapshot.paramMap.get('room')!;

    const sub1 = this.backend.getCatlord(roomId)
      .subscribe(({catlord}) => this.catlord.set(catlord));
    this.sub.push(sub1)

    const sub2 = this.backend.getGapCard(roomId)
      .subscribe(({gapCard}) => this.gapCard.set(gapCard))
    this.sub.push(sub2)
  }

  ngOnDestroy() {
    this.sub.forEach(sub => sub.unsubscribe())
  }
}
