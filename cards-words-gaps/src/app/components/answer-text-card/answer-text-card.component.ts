import {BehaviorSubject} from "rxjs";
import {NgForOf} from "@angular/common";
import {MatListModule} from "@angular/material/list";
import {Component, Input, OnInit} from "@angular/core";
import {MatCard, MatCardModule} from "@angular/material/card";
import {MatButton, MatButtonModule} from "@angular/material/button";
import {MatBadgeModule} from "@angular/material/badge";
import {SpielerKartenService} from "../../service/spieler-karten.service";
import {SpielerService} from "../../service/spieler.service";

@Component({
  selector: 'app-answer-text-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    NgForOf,
    MatListModule,
    MatBadgeModule
  ],
  templateUrl: './answer-text-card.component.html',
  styleUrl: './answer-text-card.component.scss'
})
export class AnswerTextCardComponent implements OnInit{
  @Input() spielerAntworten!: string[];
  answers = new BehaviorSubject([""])

  constructor(protected readonly spielerService:SpielerService) {
  }
  ngOnInit(): void {
  this.answers.next(this.spielerAntworten)
  }

  selectAnswer(btn: MatButton, i: number) {
    if(btn.color==="primary"){
      btn.color="secondary"
    }else {
      btn.color="primary"
    }
    console.log(document.getElementById("btn"+i)!.getAttributeNames())
    document.getElementById("btn"+i)!
      .innerText = this.spielerService.setSelectedCardNr()+" "+ document.getElementById("btn"+i)!.innerText;
    this.spielerService.setSelectedCardNr()
  }
}
