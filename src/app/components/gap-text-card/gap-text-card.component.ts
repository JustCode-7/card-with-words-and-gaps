import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatchService} from "../../service/match.service";
import {Spieler} from "../../model/spieler-model";

@Component({
  selector: 'app-gap-text-card',
  imports: [
    MatCardModule,
    MatButtonModule,
  ],
  templateUrl: './gap-text-card.component.html',
  styleUrl: './gap-text-card.component.scss'
})
export class GapTextCardComponent implements OnInit {
  cardSet = signal<string[]>(['']);
  matchService: MatchService = inject(MatchService);

  currentCatlordCard = computed(() => this.matchService.game().currentCatlordCard);

  catLordName = computed(() => {
    const game = this.matchService.game();
    return game.spieler.find((s: Spieler) => s.catLord)?.name;
  });


  ngOnInit(): void {
    this.cardSet.set(this.matchService.game().cardset);
  }

}
