import {Component, Input} from '@angular/core';
import {GapTextCardComponent} from "../components/gap-text-card/gap-text-card.component";
import {AnswerTextCardComponent} from "../components/answer-text-card/answer-text-card.component";
import {PlayerPageComponent} from "../player-page/player-page.component";
import {MatchService} from "../service/match.service";
import {SpielerKartenService} from "../service/spieler-karten.service";
import {Game} from "../modal/game-model";
import {cardSet} from "../modal/catlord-cards";
import {answerSet} from "../modal/answer-cards";
import {Spieler} from "../modal/spieler-model";
import {CatLordPageComponent} from "../cat-lord-page/cat-lord-page.component";
import {NgIf} from "@angular/common";

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
  @Input()
  catLord!: string
  @Input()
  spielerAnzahl!: string
  spielertest: Spieler = new Spieler("catlord",0,[],[],false);
  constructor(public readonly matchService:MatchService,
              public readonly spielerKartenService: SpielerKartenService) {
    this.generatePlayer();
    let game:Game = new Game(cardSet, answerSet, this.getSpieler() );
     matchService.initMatch(game)
  }



  private getSpieler():Spieler[] {
    return this.generatePlayer();
  }

  private generatePlayer() {
    let spielerArr = []
    for (let i = 0; i <= parseInt(this.spielerAnzahl) ; i++) {
      spielerArr.push(new Spieler("Dude"+i+1,0,[],[],false))
    }
    spielerArr.push(new Spieler("catlord",0,[],[],true));
    this.spielerKartenService.verteileKarten(spielerArr)
    return spielerArr;
  }

}
