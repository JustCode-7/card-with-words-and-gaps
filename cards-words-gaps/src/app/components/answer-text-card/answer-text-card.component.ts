import {BehaviorSubject} from "rxjs";
import {NgForOf} from "@angular/common";
import {MatListModule} from "@angular/material/list";
import {Component, Input, OnInit} from "@angular/core";
import {MatCardModule} from "@angular/material/card";
import {MatButton, MatButtonModule} from "@angular/material/button";
import {MatBadgeModule} from "@angular/material/badge";
import {SpielerService} from "../../service/spieler.service";
import {MatchService} from "../../service/match.service";

@Component({
  selector: 'app-answer-text-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    NgForOf,
    MatListModule,
    MatBadgeModule
  ],
  templateUrl: './answer-text-card.component.html',
  styleUrl: './answer-text-card.component.scss'
})
export class AnswerTextCardComponent implements OnInit{
  @Input() spielerAntworten!: string[];
  answers = new BehaviorSubject([""])
  answerCounter = 0;
  @Input() disabled: boolean = false;

  constructor(protected readonly spielerService:SpielerService, private readonly matchService:MatchService) {
  }
  ngOnInit(): void {
  this.answers.next(this.spielerAntworten)
  }

  selectAnswer(btn: MatButton, i: number) {
    let gapsInTextCounter = this.matchService.currentCatLordCard.value
      .match(new RegExp("___","g"))?.length
    if(gapsInTextCounter === undefined){
      gapsInTextCounter = 1
    }
    this.answerCounter++
    if(this.answerCounter <= gapsInTextCounter){
      if(btn.color==="primary"){
        btn.color="secondary"
      }else {
        btn.color="primary"
      }
      document.getElementById("btn"+i)!
        .innerText = this.spielerService.setSelectedCardNr(this.answerCounter)+" "+ document.getElementById("btn"+i)!.innerText;
      this.spielerService.setSelectedCardNr(this.answerCounter);
    }
  }


}
