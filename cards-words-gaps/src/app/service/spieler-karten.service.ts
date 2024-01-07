import {Injectable} from '@angular/core';
import {Spieler} from "../modal/spieler-model";

@Injectable({
  providedIn: 'root'
})
export class SpielerKartenService {
  private kartenProSpieler = 10
  verteilteKarten= [[""]];


    verteileKarten(spieler:Spieler[], spielerKarten: string[]) {
    const cards = this.mischeKarten(spielerKarten)
    let start = 0;
      for (const player of spieler) {
        let playerCardset = cards.slice(start,start+this.kartenProSpieler);
        this.verteilteKarten.push(playerCardset)
        player.cards = playerCardset;
        start = start + this.kartenProSpieler;
      }
  }
  private mischeKarten(spielerKarten: string[]) {
   return spielerKarten.sort(() => Math.random() - 0.5)
  }
}
