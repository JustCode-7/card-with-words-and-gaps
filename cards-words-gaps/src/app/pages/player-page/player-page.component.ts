import {Component, Input} from '@angular/core';
import {AnswerTextCardComponent} from "../../components/answer-text-card/answer-text-card.component";
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {MatButtonModule} from "@angular/material/button";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-player-page',
  standalone: true,
    imports: [
        AnswerTextCardComponent,
        GapTextCardComponent,
        MatButtonModule,
        NgForOf
    ],
  templateUrl: './player-page.component.html',
  styleUrl: './player-page.component.scss'
})
export class PlayerPageComponent {
  @Input() playername!: string;
  @Input() playercards!: string[];

  constructor() {
  }

  playerReady() {
    // set PlayerState to Ready, commit answers
  }

}
