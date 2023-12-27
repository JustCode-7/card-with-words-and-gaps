import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {RouterLink} from "@angular/router";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSelectModule} from "@angular/material/select";
import {AsyncPipe, NgForOf} from "@angular/common";
import {BehaviorSubject} from "rxjs";
import {InputHelperService} from "../service/input-helper.service";

@Component({
  selector: 'app-new-game',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatPaginatorModule,
    MatSelectModule,
    NgForOf,
    AsyncPipe
  ],
  templateUrl: './new-game.component.html',
  styleUrl: './new-game.component.scss'
})
export class NewGameComponent {
  maximaleSpielerAnzahl =  Array.of("Löschen","1","2","3","4","5","6","7","8","9","10");
  valuePlayerCount= new BehaviorSubject("Mitspieleranzahl");
  valueCreatorName= "Namen eingeben bitte";

  constructor(public readonly inputHelper: InputHelperService) {
  }

  submitConfig(valueCreatorName: string, valuePlayerCount: string) {
    if(valueCreatorName.length > 0 && valuePlayerCount.length > 0){
      // use Action
    }
    // create players(spieleranzahl + catlord(catlord-name; catloard: true)) and with dummy_names
    // create session
    // create QR with route to join-game being in session#

  }

  setPlayerCount(option: string) {
    console.log(option)
    this.valuePlayerCount.next(option);
    console.log(this.valuePlayerCount.value)
  }


}
