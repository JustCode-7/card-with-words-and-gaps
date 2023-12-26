import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {GapTextCardComponent} from "./gap-text-card/gap-text-card.component";
import {AnswerTextCardComponent} from "./answer-text-card/answer-text-card.component";
import {BehaviorSubject} from "rxjs";
import {SpielerKartenService} from "./service/spieler-karten.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatCardModule, MatButtonModule, GapTextCardComponent, AnswerTextCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'cards-words-gaps';

  constructor(public readonly spielerKartenService: SpielerKartenService) {
    this.spielerKartenService.verteileKarten()
  }

  playerReady() {
    // set PlayerState to Ready, commit answers
  }
}
