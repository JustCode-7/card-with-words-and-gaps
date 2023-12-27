import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {Spieler} from "../modal/spieler-model";

@Injectable({
  providedIn: 'root'
})
export class SpielerKartenService {
  private kartenProSpieler = 10
  answerSet= [""];


    verteileKarten(spieler:Spieler[]) {
    this.mischeKarten()
    this.kartenProSpieler = 10;
    let tmp1 = this.kartenProSpieler
    let tmp2 = 0;
    let tempArr = [""]
    for (let i = 1; i <= spieler.length; i++) {
      if(i==1){
        tempArr = this.answerSet.slice(0,tmp1)
      }else {
        tmp2 = tmp1 * 2;
        tempArr = this.answerSet.slice(tmp1, tmp2)
      }
      tmp1 = tmp2;
      spieler[i-1].cards = tempArr;
    }
  }
  private mischeKarten() {
    this.answerSet.sort(() => Math.random() - 0.5)
  }
}
