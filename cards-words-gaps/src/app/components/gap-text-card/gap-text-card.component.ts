import {Component, inject, OnInit} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {BehaviorSubject} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {MatchService} from "../../service/match.service";

@Component({
  selector: 'app-gap-text-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    AsyncPipe
  ],
  templateUrl: './gap-text-card.component.html',
  styleUrl: './gap-text-card.component.scss'
})
export class GapTextCardComponent implements OnInit{
  cardSet: BehaviorSubject<string[]> = new BehaviorSubject([''])
  matchService:MatchService = inject(MatchService);


  ngOnInit(): void {
    this.cardSet.next(this.matchService.game.value.cardset);
  }

  getCatLordname(){
    return this.matchService.game.value.spieler.find(value => value.catLord)?.name
  }


  showAnswers() {
    console.log("show all")
  }
}
