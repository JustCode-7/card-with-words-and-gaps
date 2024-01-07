import {Component, Input} from '@angular/core';
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {MatCardModule} from "@angular/material/card";
import {NgForOf, NgIf} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatchService} from "../../service/match.service";

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
  @Input() public catLordName!: string;

  constructor(protected readonly matchService: MatchService) {
  }

  submitDecision() {

  }
}
