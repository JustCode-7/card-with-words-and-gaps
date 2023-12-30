import {Component, Input, OnInit} from '@angular/core';
import {PlayerPageComponent} from "../player-page/player-page.component";
import {CatLordPageComponent} from "../cat-lord-page/cat-lord-page.component";
import {NgIf} from "@angular/common";
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {MatchService} from "../../service/match.service";
import {Game} from "../../modal/game-model";
import {cardSet} from "../../modal/catlord-cards";
import {answerSet} from "../../modal/answer-cards";

@Component({
  selector: 'app-match-page',
  standalone: true,
  imports: [
    GapTextCardComponent,
    AnswerTextCardComponent,
    PlayerPageComponent,
    CatLordPageComponent,
    NgIf
  ],
  templateUrl: './match-page.component.html',
  styleUrl: './match-page.component.scss'
})
export class MatchPageComponent implements OnInit{
  @Input()
  catLord!: string
  @Input()
  spielerAnzahl!: string
  constructor(public readonly matchService:MatchService) {
  }

  ngOnInit(): void {
    let game = new Game(cardSet, answerSet, this.matchService.initPlayerArr(this.matchService.playerCount,this.matchService.catlordName) );
    this.matchService.initMatch(game)
    }





}
