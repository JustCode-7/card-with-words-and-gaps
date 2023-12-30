import {Injectable} from '@angular/core';
import {Spieler} from "../modal/spieler-model";

@Injectable({
  providedIn: 'root'
})
export class SpielerKartenService {
  private kartenProSpieler = 10


    verteileKarten(spieler:Spieler[], spielerKarten: string[]) {
    const cards = this.mischeKarten(spielerKarten)
    this.kartenProSpieler = 10;
    let tmp1 = this.kartenProSpieler
    let tmp2 = 0;
    let tempArr = [""]
    for (let i = 0; i <= spieler.length-1; i++) {
      if(i==1){
        tempArr = cards.slice(0,tmp1)
      }else {
        tmp2 = tmp1 * 2;
        tempArr = cards.slice(tmp1, tmp2)
      }
      tmp1 = tmp2;
      spieler[i].cards = tempArr;
      console.log(spieler[i].cards)
    }
  }
  private mischeKarten(spielerKarten: string[]) {
   return spielerKarten.sort(() => Math.random() - 0.5)
  }
}
