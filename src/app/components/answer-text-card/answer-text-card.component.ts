import {ChangeDetectorRef, Component, effect, inject, Input, OnInit, signal} from "@angular/core";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatBadgeModule} from "@angular/material/badge";
import {MatchService} from "../../service/match.service";
import {SocketService} from "../../service/socket.service";

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
    MatBadgeModule,
  ],
  templateUrl: './answer-text-card.component.html',
  styleUrl: './answer-text-card.component.scss'
})
export class AnswerTextCardComponent implements OnInit {
  answerCounter = 0;
  @Input() disabled: boolean = false;
  gapsInTextCounter = 1;
  @Input() playername!: string;

  matchService: MatchService = inject(MatchService);
  socketService: SocketService = inject(SocketService);
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  answerset = signal<Answer[]>([]);
  gaptext = signal<string>('');
  lueckentextArr: { text: string, gap: string }[] = [];
  lastpickedAnswerIndex = 0;
  selectedAnswers: Answer[] = [];
  protected gapCount = signal<number>(1);

  constructor() {
    // Reaktivität via Angular Effect
    effect(() => {
      const game = this.matchService.gameSignal();
      if (!game || !game.gameHash) return;

      const currentPlayerId = this.socketService.getPlayerId();
      // Find the player in the game via ID (preferred) or Name
      const playerInGame = game.spieler.find((s: any) =>
        s.id === currentPlayerId || (s.name === this.playername && !s.id)
      );

      if (playerInGame) {
        // Deep compare of cards to see if we need an update
        const currentCards = this.answerset().map(a => a.answer);
        const hasChanged = JSON.stringify(currentCards) !== JSON.stringify(playerInGame.cards);

        if (hasChanged || (game.isStarted && this.answerset().length === 0)) {
          console.log(`[DEBUG_LOG] AnswerCard effect update: ${playerInGame.name}, Cards: ${playerInGame.cards.length}`);
          this.answerset.set(playerInGame.cards.map(card => ({answer: card, selected: false})));
        }
      }

      if (game.currentCatlordCard && (game.currentCatlordCard !== this.gaptext() || game.roundStatus === 'WAITING_FOR_ANSWERS')) {
        if (game.currentCatlordCard !== this.gaptext() || this.lueckentextArr.length === 0) {
          this.resetVariables();
          this.gaptext.set(game.currentCatlordCard);
          this.countGaps();
          this.prepareFillIntoGaps();
        }
      }
    });
  }

  ngOnInit(): void {
    console.log(`[DEBUG_LOG] AnswerCard OnInit: playerName=${this.playername}`);
  }

  submitAnswers() {
    const selected = this.answerset()
      .filter(a => a.selected)
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map(a => a.answer);

    const required = Math.max(1, this.gapCount());

    if (selected.length === required) {
      this.matchService.playerReady(this.playername, selected);
    } else {
      alert(`Bitte wähle genau ${required} Karte(n) aus.`);
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
    if (answer.selected) {
      // Deselect
      answer.selected = false;
      const indexToRemove = answer.index;
      answer.index = 0;

      // Find the gap that contains this answer and reset it
      const gapIndex = this.lueckentextArr.findIndex(g => g.gap === answer.answer);
      if (gapIndex !== -1) {
        this.lueckentextArr[gapIndex].gap = '___';
      }

      // Re-index remaining selected answers
      const currentAnswers = this.answerset();
      currentAnswers
        .filter(a => a.selected && a.index! > (indexToRemove || 0))
        .forEach(a => a.index!--);

      this.answerset.set([...currentAnswers]);
      return;
    }

    // Select logic
    const currentAnswers = this.answerset();
    const selectedCount = currentAnswers.filter(a => a.selected).length;
    const maxAllowed = Math.max(1, this.gapCount());

    if (selectedCount >= maxAllowed) {
      // If we are already at the limit, the logic in fillSelectedAnswerIntoGap
      // will handle replacing the last one.
      // But we need to make sure we don't increment the index further if it's a replacement
      this.fillSelectedAnswerIntoGap(answer);
      answer.selected = true;
      answer.index = maxAllowed;
    } else {
      this.fillSelectedAnswerIntoGap(answer);
      answer.selected = true;
      answer.index = currentAnswers.filter((value) => value.selected).length;
    }
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
    this.gapCount.set(this.gaptext().split('___').length - 1);
  }

  /**
   * prepare luckentext-array for filling gaps
   * @private
   */
  private prepareFillIntoGaps() {
    this.gaptext().split('___').forEach((gapText, gapTextindex) => {
      if (this.gapCount() > 0 && gapTextindex === this.gaptext().split('___').length - 1) {
        this.lueckentextArr.push({text: gapText, gap: ''});
      } else {
        this.lueckentextArr.push({text: gapText, gap: '___'});
      }
    });
    this.lastpickedAnswerIndex = this.lueckentextArr.length - 1
  }

  private resetVariables() {
    this.lueckentextArr = [];
    this.gapCount.set(0);
    this.lastpickedAnswerIndex = 0;
    this.answerset.set([]);
    this.selectedAnswers = [];
  }

  private ifThereAGapJustFillInto(answer: Answer) {
    const gapIdx = this.lueckentextArr.findIndex(value => value.gap === '___');
    if (gapIdx !== -1) {
      this.lueckentextArr[gapIdx].gap = answer.answer;
    }
  }

  private whenNoGapLeftChangeLastNotChanged(answer: Answer) {
    if (this.lueckentextArr.every((value) => value.gap !== '___')) {
      if (this.gapCount() > 1) {
        let foundedIdx = this.lueckentextArr.findIndex((value, index) =>
          value.gap !== answer.answer && this.lastpickedAnswerIndex !== index
        );
        if (foundedIdx !== -1) {
          this.lastpickedAnswerIndex = foundedIdx;
          const oldAnswerText = this.lueckentextArr[foundedIdx].gap;

          // Deselect the old answer in the answerset
          const currentAnswers = this.answerset();
          const oldAnswer = currentAnswers.find(a => a.answer === oldAnswerText);
          if (oldAnswer) {
            oldAnswer.selected = false;
            oldAnswer.index = 0;
          }

          this.lueckentextArr[foundedIdx].gap = answer.answer;
          this.answerset.set([...currentAnswers]);
        }
      } else {
        // if there is only one gap-value fill it
        let foundedIdx = this.lueckentextArr.findIndex((value) =>
          value.gap !== answer.answer);
        if (foundedIdx !== -1) {
          const oldAnswerText = this.lueckentextArr[foundedIdx].gap;

          // Deselect the old answer
          const currentAnswers = this.answerset();
          const oldAnswer = currentAnswers.find(a => a.answer === oldAnswerText);
          if (oldAnswer) {
            oldAnswer.selected = false;
            oldAnswer.index = 0;
          }

          this.lueckentextArr[foundedIdx].gap = answer.answer;
          this.answerset.set([...currentAnswers]);
        }
      }
    }
  }

  private getRandomLueckentext() {
    this.gaptext.set(this.matchService.game.value.cardset.at(Math.random() * this.matchService.game.value.cardset.length - 1)!);
  }

  private getRandomAnswerSet() {
    const currentAnswers = this.answerset();
    while (currentAnswers.length <= 6) {
      const tempRandomAnswer: Answer = {
        answer: this.matchService.game.value.answerset.at(Math.random() * this.matchService.game.value.answerset.length - 1)!,
        selected: false
      };
      if (!currentAnswers.some((ans: Answer) => ans.answer === tempRandomAnswer.answer)) {
        currentAnswers.push(tempRandomAnswer);
      }
    }
    this.answerset.set([...currentAnswers]);
  }

}
