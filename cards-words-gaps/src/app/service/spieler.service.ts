import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpielerService {

  setSelectedCardNr(index: number){
    return index;
  }

  lockAllActions(){
    // Lock all Actions on app-answer-text-card
    this.sendReadyStatusToCatLordPage()
  }

  sendReadyStatusToCatLordPage(){

  }
}
