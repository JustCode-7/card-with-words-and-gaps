import {Component, OnInit} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {Router, RouterLink} from "@angular/router";
import {InputHelperService} from "../../service/input-helper.service";
import {MatchService} from "../../service/match.service";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {NgForOf} from "@angular/common";
import {BehaviorSubject} from "rxjs";
import {SocketService} from "../../service/socket.service";
import {Game} from "../../modal/game-model";

@Component({
  selector: 'app-join-game',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
    MatOptionModule,
    MatSelectModule,
    NgForOf
  ],
  templateUrl: './join-game-page.component.html',
  styleUrl: './join-game-page.component.scss'
})
export class JoinGamePageComponent implements OnInit {
  valuePlayerName = "Bitte Namen eingeben.";
  roomIds = new BehaviorSubject<string[]>(Array.of("Löschen"));
  valuePlayerRoom = new BehaviorSubject("PlayerRoom");
  game: Game | undefined;


  constructor(public readonly inputHelper: InputHelperService,
              private readonly matchService: MatchService,
              private readonly socketService: SocketService,
              private readonly router:Router) {
  }

  ngOnInit(): void {
    this.updateRooms();
  }


  protected updateRooms() {
    this.socketService.send('getRoomID', 'giveMeRoomID');
    this.socketService.getRoomID().subscribe(values => {
      values.forEach(value => {
        if(!this.roomIds.value.some(currentValue => currentValue === value)){
          this.roomIds.value.push(value)
        }
      })
    })
  }

  joinGame(valuePlayerName: string) {
    this.socketService.send('joinRoomID', this.valuePlayerRoom.value)
    this.socketService.getGame().subscribe(value => {
      this.matchService.game = value;
      console.log(value)

      if(valuePlayerName.length > 0 && this.matchService.game !== undefined){
        const free = this.matchService
          .game
          .spieler
          .find(value => value.name.toLowerCase().includes("dude"))

        this.matchService
          .game
          .spieler
          .forEach(player => {
            if(player === free){
              player.name = valuePlayerName;
              console.log(player)
            }
          })
        this.router.navigate(['/game','player'])
      }
    });

  }

  reload() {
    this.ngOnInit();
  }
}
