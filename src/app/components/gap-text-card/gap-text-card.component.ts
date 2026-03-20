import {Component, inject, OnInit} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {BehaviorSubject, map, Observable} from "rxjs";
import {MatchService} from "../../service/match.service";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-gap-text-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    AsyncPipe
  ],
  templateUrl: './gap-text-card.component.html',
  styleUrl: './gap-text-card.component.scss'
})
export class GapTextCardComponent implements OnInit {
  cardSet: BehaviorSubject<string[]> = new BehaviorSubject([''])
  matchService: MatchService = inject(MatchService);

  currentCatlordCard$: Observable<string> = this.matchService.game.pipe(
    map(game => game.currentCatlordCard)
  );

  catLordName$: Observable<string | undefined> = this.matchService.game.pipe(
    map(game => game.spieler.find(s => s.catLord)?.name)
  );


  ngOnInit(): void {
    this.cardSet.next(this.matchService.game.value.cardset);
  }

}
