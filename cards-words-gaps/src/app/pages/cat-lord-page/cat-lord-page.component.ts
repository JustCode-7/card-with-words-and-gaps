import {Component, inject, Input} from '@angular/core';
import {GapTextCardComponent} from "../../components/gap-text-card/gap-text-card.component";
import {MatCardModule} from "@angular/material/card";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
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
    NgIf,
    AsyncPipe
  ],
  templateUrl: './cat-lord-page.component.html',
  styleUrl: './cat-lord-page.component.scss'
})
export class CatLordPageComponent{
  @Input() public catLordName!: string;
  matchService: MatchService = inject(MatchService);


  submitDecision() {

  }
}
