import {BehaviorSubject} from "rxjs";
import {AsyncPipe, NgForOf} from "@angular/common";
import {MatListModule, MatListOption, MatSelectionList} from "@angular/material/list";
import {Component, Input, OnInit} from "@angular/core";
import {MatCardModule} from "@angular/material/card";
import {MatButton, MatButtonModule} from "@angular/material/button";
import {MatBadgeModule} from "@angular/material/badge";
import {MatchService} from "../../service/match.service";

@Component({
  selector: 'app-answer-text-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    NgForOf,
    MatListModule,
    MatBadgeModule,
    AsyncPipe
  ],
  templateUrl: './answer-text-card.component.html',
  styleUrl: './answer-text-card.component.scss'
})
export class AnswerTextCardComponent implements OnInit{
  @Input() spielerAntworten!: string[];
  answers = new BehaviorSubject([""])
  answerCounter = 0;
  @Input() disabled: boolean = false;
  gapsInTextCounter = 1;
  @Input() playername!: string;

  constructor(protected readonly matchService:MatchService) {
  }
  ngOnInit(): void {
  this.answers.next(this.spielerAntworten);
  this.gapsInTextCounter = this.matchService.currentCatLordCard.value
      .match(new RegExp("___","g"))?.length ?? 1;
  }

  private changeBtnColor(btn: MatButton) {
    if (btn.color === "primary") {
      btn.color = "secondary"
      this.answerCounter--;
    } else {
      btn.color = "primary"
      this.answerCounter++;
    }
  }

  checkPossibleAnswers(items: MatSelectionList, item: MatListOption, btn: MatButton) {

    if (items.selectedOptions.selected.length > this.gapsInTextCounter){
      item._setSelected(false)
    }
    if (items.selectedOptions.selected.length <= this.gapsInTextCounter){
      this.changeBtnColor(btn)
    }
    this.saveAnswer(btn, item)
  }

  private saveAnswer(btn: MatButton, item: MatListOption) {
    if(item.selected){
      if(this.gapsInTextCounter < this.answerCounter){

      }
      console.log(btn._elementRef.nativeElement.innerText + " --" + this.answerCounter)
    }
  }


}
