import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {RouterLink} from "@angular/router";
import {InputHelperService} from "../../service/input-helper.service";
import {MatchService} from "../../service/match.service";

@Component({
  selector: 'app-join-game',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink
  ],
  templateUrl: './join-game-page.component.html',
  styleUrl: './join-game-page.component.scss'
})
export class JoinGamePageComponent {
  valuePlayerName= "Bitte Namen eingeben.";

  constructor(public readonly inputHelper: InputHelperService, private readonly matchService: MatchService) {
  }


  joinGame(valuePlayerName: string) {
      if(valuePlayerName.length > 0){
       const free = this.matchService
         .game
         .spieler
         .find(value => value.name.toLowerCase().includes("dude"))
        this.matchService
          .game
          .spieler
          .forEach(value => {
          if(value === free){
            value.name = valuePlayerName;
          }
        })
      }
  }
}
