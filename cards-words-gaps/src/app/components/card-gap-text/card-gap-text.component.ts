import {Component, computed, input} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {Card} from "../../model/card";

@Component({
  selector: 'app-card-gap-text',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule
  ],
  template: `
    <div class="container">
      <mat-card appearance="outlined">
        <mat-card-content>
          {{ firstPart() }}

          <code class="border border-white">1</code>
          <span class="border border-white m-1 p-1">{{ firstCard().text }}</span>

          {{ secondPart() }}

          @if (showSecondGap()) {
            <code class="border border-white">2</code>
            <span class="border border-white m-1 p-1">{{ secondCard().text }}</span>

            {{ thirdPart() }}
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: ``
})
export class CardGapTextComponent {
  gapCard = input<Card>({id: '', text: 'This is just a placeholder for ___ .'})
  showSecondGap = input<boolean>(false)

  firstPart = computed(() => this.gapCard().text.split('___')[0]);
  secondPart = computed(() => this.gapCard().text.split('___')[1]);
  thirdPart = computed(() => this.gapCard().text.split('___')[2]);

  firstCard = input<Card>({id: '', text: '___'})
  secondCard = input<Card>({id: '', text: '___'})
}
