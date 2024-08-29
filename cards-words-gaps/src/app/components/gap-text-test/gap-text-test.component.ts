import {Component, inject, OnInit} from '@angular/core';
import {GapTextCardComponent} from "../gap-text-card/gap-text-card.component";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {BehaviorSubject} from "rxjs";
import {MatchService} from "../../service/match.service";
import {AsyncPipe} from "@angular/common";

interface Answer {
  answer: string;
  selected: boolean
  index?: number
}

@Component({
  selector: 'app-gap-text-test',
  standalone: true,
  imports: [
    GapTextCardComponent,
    MatButtonModule,
    MatCardModule,
    AsyncPipe
  ],
  templateUrl: './gap-text-test.component.html',
})
export class GapTextTestComponent implements OnInit {
  matchService: MatchService = inject(MatchService);
  answerset: Answer[] = [{answer: '', selected: false}];
  gaptext = new BehaviorSubject('')
  lueckentextArr = [{text: '', gap: ''}];
  protected gapCount = new BehaviorSubject(1);
  lastpickedAnswerIndex = 0;
  selectedAnswers = [{answer: '', selected: false}];


  ngOnInit(): void {
    this.matchService.initMatch('test'); // init match just for testing
    this.resetVariables();
    this.getRandomLueckentext();
    this.getRandomAnswerSet();
    this.countGaps();
    this.prepareFillIntoGaps();
  }

  getNext() {
    this.resetVariables();
    this.getRandomLueckentext();
    this.getRandomAnswerSet();
    this.countGaps();
    this.prepareFillIntoGaps();
  }

  private countGaps() {
    this.gapCount.next(this.gaptext.value.split('___').length - 1);
  }

  /**
   * prepare luckentext-array for filling gaps
   * @private
   */
  private prepareFillIntoGaps() {
    this.gaptext.value.split('___').forEach((gapText, gapTextindex) => {
      if (this.gapCount.value > 0 && gapTextindex === this.gaptext.value.split('___').length - 1) {
        this.lueckentextArr.push({text: gapText, gap: ''});
      } else {
        this.lueckentextArr.push({text: gapText, gap: '___'});
      }
    });
    this.lastpickedAnswerIndex = this.lueckentextArr.length - 1
  }

  private resetVariables() {
    this.lueckentextArr = [];
    this.gapCount.next(0);
    this.lastpickedAnswerIndex = 0;
    this.answerset = [];
    this.selectedAnswers = [];
  }

  pickAnswerAndFillIntoGaps(answer: Answer) {
    this.fillSelectedAnswerIntoGap(answer);
    if (!this.answerset.some((value) => value.selected)) {
      answer.selected = !answer.selected;
      answer.index = 1;
    } else {
      answer.selected = !answer.selected;
      answer.index = this.answerset.filter((value) => value.selected).length;
    }


    this.answerset.forEach((value) => {
      if (value.answer !== answer.answer && value.index! < 1) {
        value.selected = false;
      }
    });
  }


  /**
   * fill selected answer into gap
   * @param answer
   */
  fillSelectedAnswerIntoGap(answer: Answer) {
    this.whenNoGapLeftChangeLastNotChanged(answer);
    this.ifThereAGapJustFillInto(answer);

  }

  private ifThereAGapJustFillInto(answer: Answer) {
    if (this.lueckentextArr.some((value) => value.gap === '___')) {
      let founded = this.lueckentextArr.find((value) => value.gap === '___');
      this.lueckentextArr[this.lueckentextArr.indexOf(founded!)].gap = answer.answer;
    }
  }

  private whenNoGapLeftChangeLastNotChanged(answer: Answer) {
    if (this.lueckentextArr.every((value) => value.gap !== '___')) {
      if (this.gapCount.value > 1) {
        let founded = this.lueckentextArr.find((value, index) =>
          value.gap !== answer.answer && this.lastpickedAnswerIndex !== index
        );
        this.lastpickedAnswerIndex = this.lueckentextArr.indexOf(founded!);
        if (founded && this.lueckentextArr[this.lueckentextArr.indexOf(founded)].gap) {
          this.lastpickedAnswerIndex = this.lueckentextArr.indexOf(founded);
          this.lueckentextArr[this.lueckentextArr.indexOf(founded)].gap = answer.answer;
        }
      } else {
        // if there is only one gap-value fill it
        let founded = this.lueckentextArr.find((value) =>
          value.gap !== answer.answer);
        if (founded && this.lueckentextArr[this.lueckentextArr.indexOf(founded)].gap) {
          this.lueckentextArr[this.lueckentextArr.indexOf(founded)].gap = answer.answer;
        }
      }
    }
  }

  private getRandomLueckentext() {
    this.gaptext.next(this.matchService.game.value.cardset.at(Math.random() * this.matchService.game.value.cardset.length - 1)!);
  }

  private getRandomAnswerSet() {
    while (this.answerset.length <= 6) {
      const tempRandomAnswer: Answer = {
        answer: this.matchService.game.value.answerset.at(Math.random() * this.matchService.game.value.answerset.length - 1)!,
        selected: false
      };
      if (!this.answerset.some((answer) => answer.answer === tempRandomAnswer.answer)) {
        this.answerset.push(tempRandomAnswer);
      }
    }
  }

  markFirstFreeAnswer() {
    document.getElementById('answerbtn0')?.focus();
  }

  lalal(answer: Answer) {
    switch (answer.index) {
      case 1:
        return 'primary';
      case 2:
        return 'accent';
      case 3:
        return 'warn';
      default:
        return '';
    }
  }
}
