import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpielerService {
  selectedAnswerNr : number | undefined;
  constructor() { }

  setSelectedCardNr(){
    if(this.selectedAnswerNr === undefined){
     return  this.selectedAnswerNr = 1
    }else {
    return  this.selectedAnswerNr = this.selectedAnswerNr + 1
    }

  }
}
