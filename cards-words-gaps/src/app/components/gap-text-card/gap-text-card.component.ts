import {Component, OnInit} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {BehaviorSubject} from "rxjs";
import {AsyncPipe} from "@angular/common";

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
  currentCardNr = 0
  cardSet =[""]
  cardNumber= parseInt((Math.random() * this.cardSet.length - 1).toFixed());
  currentCard?: BehaviorSubject<string> ;

  ngOnInit(): void {
    this.cardNumber = parseInt((Math.random() * this.cardSet.length - 1).toFixed());
    this.currentCardNr = this.cardNumber;
    this.currentCard = new BehaviorSubject(this.cardSet[this.currentCardNr])
  }


  nextCard() {
    if(this.cardSet.length < 1){
      return;
    }
    if(this.cardSet.length === 1){
      this.currentCardNr = 1;
    }
    this.cardSet.splice(this.currentCardNr,1);
    this.cardNumber = parseInt((Math.random() * this.cardSet.length - 1).toFixed());
    this.currentCardNr = this.cardNumber;
    if(this.cardSet[this.currentCardNr] === undefined){
      this.cardNumber = parseInt((Math.random() * this.cardSet.length - 1).toFixed());
      this.currentCardNr = this.cardNumber;
    }
    this.currentCard?.next(this.cardSet[this.currentCardNr])
    this.changeCardMaster();
  }

  changeCardMaster() {
    // change Master
    this.fillSpielerCardStack()
  }



  showAnswers() {
    console.log("show all")
  }

  fillSpielerCardStack() {
    // randomly fill answer cards for every player to 10
  }
}