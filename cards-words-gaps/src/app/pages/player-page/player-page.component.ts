import {Component, inject, Input, OnInit} from '@angular/core';
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {MatButtonModule} from "@angular/material/button";
import {NgForOf} from "@angular/common";
import {BehaviorSubject} from "rxjs";
import {MatchService} from "../../service/match.service";
import {Spieler} from "../../model/spieler-model";

@Component({
  selector: 'app-player-page',
  standalone: true,
    imports: [
        AnswerTextCardComponent,
        GapTextCardComponent,
        MatButtonModule,
        NgForOf
    ],
  templateUrl: './player-page.component.html',
  styleUrl: './player-page.component.scss'
})
export class PlayerPageComponent implements OnInit {
  @Input('playername') playername!: string;
  locked = new BehaviorSubject(false);
  matchService: MatchService = inject(MatchService);
  player: BehaviorSubject<Spieler> = new BehaviorSubject(new Spieler("dummy", 1, [], [], false));

  ngOnInit(): void {
    console.log(this.playername)
    this.matchService.socketService.getGame().subscribe(game => {
      game.spieler.find(spieler => {
        if (!spieler.catLord && spieler.name === this.playername) {
          console.log("Player found: "+spieler.name)
          this.player.next(spieler);
        }
      })
      this.matchService.game.next(game);
    })

  }

  getCatlord() {
    return this.matchService.game.value.spieler.find(value => value.catLord)!
  }

}
