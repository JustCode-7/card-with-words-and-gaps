import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {RouterLink} from "@angular/router";
import {InputHelperService} from "../service/input-helper.service";

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
  templateUrl: './join-game.component.html',
  styleUrl: './join-game.component.scss'
})
export class JoinGameComponent {
  valuePlayerName= "Bitte Namen eingeben.";

  constructor(public readonly inputHelper: InputHelperService) {
  }

  submitPlayername() {

  }

  joinGame(valuePlayerName: string) {
      if(valuePlayerName.length > 0){
        // use Action
      }

  }
}
