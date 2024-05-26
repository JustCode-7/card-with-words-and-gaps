import {Component, Input} from '@angular/core';
import {PlayerPageComponent} from "../player-page/player-page.component";
import {CatLordPageComponent} from "../cat-lord-page/cat-lord-page.component";
import {NgIf} from "@angular/common";
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {MatchService} from "../../service/match.service";

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
export class MatchPageComponent {
  @Input() kindOfPlayer!: string


  constructor(public readonly matchService:MatchService) {
    console.log(this.kindOfPlayer)
  }


  getCatlord() {
    return this.matchService.game.spieler.find(value => value.catLord)!
  }

  getPlayer() {
    return this.matchService.game.spieler.find(value => !value.catLord)!
  }

  checkIfCurrentPlayerIsCatlord() {
    return this.kindOfPlayer === "catlord";
  }
}
