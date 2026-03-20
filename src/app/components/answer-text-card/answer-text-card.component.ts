import {BehaviorSubject} from "rxjs";
import {MatListModule} from "@angular/material/list";
import {Component, inject, Input, OnInit} from "@angular/core";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatBadgeModule} from "@angular/material/badge";
import {MatchService} from "../../service/match.service";
import {SocketService} from "../../service/socket.service";
import {AsyncPipe} from "@angular/common";

interface Answer {
  answer: string;
  selected: boolean
  index?: number
}

@Component({
  selector: 'app-answer-text-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatBadgeModule,
    AsyncPipe,
  ],
  templateUrl: './answer-text-card.component.html',
  styleUrl: './answer-text-card.component.scss'
})
export class AnswerTextCardComponent implements OnInit {
  @Input() spielerAntworten!: string[];
  answers = new BehaviorSubject([""])
  answerCounter = 0;
  @Input() disabled: boolean = false;
  gapsInTextCounter = 1;
  @Input() playername!: string;

  matchService: MatchService = inject(MatchService);
  socketService: SocketService = inject(SocketService);
  answerset = new BehaviorSubject<Answer[]>([]);
  gaptext = new BehaviorSubject('')
  lueckentextArr: { text: string, gap: string }[] = [];
  lastpickedAnswerIndex = 0;
  selectedAnswers: Answer[] = [];
  protected gapCount = new BehaviorSubject(1);

  ngOnInit(): void {
    const currentPlayerId = this.socketService.getPlayerId();

    this.matchService.game.subscribe(game => {
      // Find the player in the game via ID (preferred) or Name
      const playerInGame = game.spieler.find((s: any) =>
        s.id === currentPlayerId || (s.name === this.playername && !s.id)
      );

      if (playerInGame) {
        // Deep compare of cards to see if we need an update
        const currentCards = this.answerset.value.map(a => a.answer);
        const hasChanged = JSON.stringify(currentCards) !== JSON.stringify(playerInGame.cards);

        // Only update if number of cards changed or cards themselves changed,
        // OR we are not in readiness state
        if (hasChanged || !playerInGame.ready) {
          console.log(`[DEBUG_LOG] AnswerCard: Updating cards for ${playerInGame.name}`, playerInGame.cards);
          this.answerset.next(playerInGame.cards.map(card => ({answer: card, selected: false})));
        }
      }

      if (game.currentCatlordCard && (game.currentCatlordCard !== this.gaptext.value || game.roundStatus === 'WAITING_FOR_ANSWERS')) {
        if (game.currentCatlordCard !== this.gaptext.value || this.lueckentextArr.length === 0) {
          this.resetVariables();
          this.gaptext.next(game.currentCatlordCard);
          this.countGaps();
          this.prepareFillIntoGaps();
        }
      }
    });
  }

  submitAnswers() {
    const selected = this.answerset.value
      .filter(a => a.selected)
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map(a => a.answer);

    if (selected.length === this.gapCount.value || (this.gapCount.value === 0 && selected.length === 1)) {
      this.matchService.playerReady(this.playername, selected);
    } else {
      alert(`Bitte wähle genau ${this.gapCount.value || 1} Karte(n) aus.`);
    }
  }

  getNext() {
    this.resetVariables();
    this.getRandomLueckentext();
    this.getRandomAnswerSet();
    this.countGaps();
    this.prepareFillIntoGaps();
  }

  pickAnswerAndFillIntoGaps(answer: Answer) {
    this.fillSelectedAnswerIntoGap(answer);
    const currentAnswers = this.answerset.value;
    if (!currentAnswers.some((value) => value.selected)) {
      answer.selected = !answer.selected;
      answer.index = 1;
    } else {
      answer.selected = !answer.selected;
      answer.index = currentAnswers.filter((value) => value.selected).length;
    }


    currentAnswers.forEach((value) => {
      if (value.answer !== answer.answer && value.index! < 1) {
        value.selected = false;
      }
    });
    this.answerset.next(currentAnswers);
  }

  /**
   * fill selected answer into gap
   * @param answer
   */
  fillSelectedAnswerIntoGap(answer: Answer) {
    this.whenNoGapLeftChangeLastNotChanged(answer);
    this.ifThereAGapJustFillInto(answer);

  }

  markFirstFreeAnswer() {
    document.getElementById('answerbtn0')?.focus();
  }

  changeButtonColorDependingOnAnswerpickCounter(answer: Answer) {
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
    this.answerset.next([]);
    this.selectedAnswers = [];
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
    const currentAnswers = this.answerset.value;
    while (currentAnswers.length <= 6) {
      const tempRandomAnswer: Answer = {
        answer: this.matchService.game.value.answerset.at(Math.random() * this.matchService.game.value.answerset.length - 1)!,
        selected: false
      };
      if (!currentAnswers.some((ans: Answer) => ans.answer === tempRandomAnswer.answer)) {
        currentAnswers.push(tempRandomAnswer);
      }
    }
    this.answerset.next(currentAnswers);
  }

}
