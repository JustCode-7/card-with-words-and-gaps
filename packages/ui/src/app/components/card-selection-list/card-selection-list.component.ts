import {Component, input, output} from '@angular/core';
import {MatListModule} from "@angular/material/list";
import {MatButtonModule} from "@angular/material/button";
import {v4 as uuidv4} from 'uuid';
import {Card} from "@cards-with-words-and-gaps/shared/dist/model/card";


@Component({
  selector: 'app-card-selection-list',
  standalone: true,
  imports: [
    MatListModule,
    MatButtonModule
  ],
  template: `
    <h2>Please pick your cards</h2>
    @for (card of cards(); track card.id) {
      <div class="highlight-on-hover d-flex w-100 justify-content-between align-items-baseline">
        {{ card.text }}
        <div>
          <button mat-mini-fab class="ms-1" (click)="onFirstChoice.emit(card)">1</button>
          @if (showButtonTwo()) {
            <button mat-mini-fab class="ms-1" (click)="onSecondChoice.emit(card)">2</button>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .highlight-on-hover:hover {
      background-color: rgba(255, 255, 255, 0.1);;
    }
  `
})
export class CardSelectionListComponent {

  cards = input<Card[]>([
    {id: uuidv4(), text: 'Santa Clause'},
    {id: uuidv4(), text: 'sleigh riding'},
    {id: uuidv4(), text: 'Adlerhorst'},
  ])

  showButtonTwo = input<boolean>(false);

  onFirstChoice = output<Card>()
  onSecondChoice = output<Card>()

}
