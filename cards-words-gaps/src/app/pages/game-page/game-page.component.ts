import {Component, computed, inject, signal} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {CardSelectionListComponent} from "../../components/card-selection-list/card-selection-list.component";
import {Card, emptyCard} from "../../model/card";
import {CardGapTextComponent} from "../../components/card-gap-text/card-gap-text.component";

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [
    AnswerTextCardComponent,
    CardSelectionListComponent,
    CardGapTextComponent
  ],
  template: `
    <div class="container">
      <h1>Cats against humanity // Room: {{ route.snapshot.paramMap.get('room') }}</h1>
      <app-card-gap-text
        [gapCard]="gapCard()"
        [showSecondGap]="hasSecondGap()"
        [firstCard]="firstCard()"
        [secondCard]="secondCard()"
      />
      <app-card-selection-list
        [showButtonTwo]="hasSecondGap()"
        (onFirstChoice)="firstCard.set($event)"
        (onSecondChoice)="secondCard.set($event)"
      />
      <app-answer-text-card [spielerAntworten]="['Santa', 'Batman']"/>
    </div>
  `,
  styles: ``
})
export class GamePage {
  route = inject(ActivatedRoute);

  firstCard = signal<Card>({...emptyCard, text: '___'})
  secondCard = signal<Card>({...emptyCard, text: '___'})

  gapCard = signal<Card>({id: '', text: 'Welcome home son of ___, did you really ___ ?'})
  hasSecondGap = computed(() => this.gapCard().text.split('___').length === 3)
}
