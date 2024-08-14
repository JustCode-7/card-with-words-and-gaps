import {booleanAttribute, Component, Input} from '@angular/core';
import {MatListModule} from "@angular/material/list";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [
    MatListModule,
    MatButtonModule
  ],
  template: `
    <h2>Please select your cards</h2>
    @for (card of cards; track card.id) {
      <div class="highlight-on-hover d-flex w-100 justify-content-between align-items-baseline">
        {{ card.text }}
        <div>
          <button mat-mini-fab class="ms-1">1</button>
          @if (hasSecondGap) {
            <button mat-mini-fab class="ms-1">2</button>
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
export class CardListComponent {
  cards = [
    {id: 1, text: 'Santa Clause'},
    {id: 2, text: 'sleigh riding'},
    {id: 3, text: 'Adlerhorst'},
  ]
  @Input({required: true, transform: booleanAttribute}) hasSecondGap = false
  
}
