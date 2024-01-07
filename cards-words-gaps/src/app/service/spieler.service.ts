import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpielerService {

  setSelectedCardNr(index: number, innerText: string){
    return {index: index, innerText: innerText};
  }

  lockAllActions(){
    // Lock all Actions on app-answer-text-card
    this.sendReadyStatusToCatLordPage()
  }

  sendReadyStatusToCatLordPage(){

  }
}
