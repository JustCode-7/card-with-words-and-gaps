import {Component, Input} from '@angular/core';
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {MatCardModule} from "@angular/material/card";
import {NgForOf, NgIf} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatchService} from "../../service/match.service";
import {Spieler} from "../../modal/spieler-model";

@Component({
  selector: 'app-cat-lord-page',
  standalone: true,
  imports: [
    GapTextCardComponent,
    MatCardModule,
    NgForOf,
    MatButtonModule,
    NgIf
  ],
  templateUrl: './cat-lord-page.component.html',
  styleUrl: './cat-lord-page.component.scss'
})
export class CatLordPageComponent {
  spielerArr: Spieler[] | undefined;
  @Input() public playername!: string;

  constructor(private readonly matchService: MatchService) {
    this.spielerArr = matchService.spielerArr;
  }

  submitDecision() {

  }
}
