import {Component, inject} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {CardListComponent} from "../../components/card-list/card-list.component";

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [
    AnswerTextCardComponent,
    CardListComponent
  ],
  template: `
    <div class="container">
      <h1>Cats against humanity // Room: {{ route.snapshot.paramMap.get('room') }}</h1>
      <p>
        game-page works!
      </p>
      <app-card-list/>
      <app-answer-text-card [spielerAntworten]="['Santa', 'Batman']"/>
    </div>
  `,
  styles: ``
})
export class GamePage {
  route = inject(ActivatedRoute);
}
