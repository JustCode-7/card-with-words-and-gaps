import {Component, inject, OnInit} from '@angular/core';
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
import {Spieler} from "../../modal/spieler-model";

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
  socketService: SocketService =  inject(SocketService);
  matchService: MatchService = inject(MatchService);


  constructor(public readonly inputHelper: InputHelperService,
              private readonly router:Router) {
  }

  ngOnInit(): void {
    this.matchService.initIoConnection();
    this.updateRooms();
  }


  protected updateRooms() {
    this.socketService.sendRoomID('getRoomID', 'giveMeRoomID');
    this.socketService.getRoomID().subscribe(values => {
      values.forEach(value => {
        if(!this.roomIds.value.some(currentValue => currentValue === value)){
          this.roomIds.value.push(value)
        }
      })
    })
  }

  joinGame(valuePlayerName: string, roomid: string) {
    this.socketService.sendRoomID('joinRoomID', roomid)
    console.log("Joind Room: "+roomid)
    this.socketService.getGame().subscribe({
      next: gamefromBE => {
        if (valuePlayerName.length > 0 && gamefromBE !== undefined) {
          const free = gamefromBE.spieler.find((value:Spieler) => value.name.toLowerCase().includes("dude"))
          console.log("Free Bot"+free?.name)
          gamefromBE
            .spieler
            .forEach((player: Spieler) => {
              if (player === free) {
                player.name = valuePlayerName;
                console.log("Player JOINED")
                console.log(player)
              }
            })
        }
        this.matchService.game.next(gamefromBE);
        this.socketService.sendUpdateGame('updateGame', this.matchService.game.value)
        console.log(this.matchService.game.value)
      }
    });


    this.router.navigate(['/game',roomid, valuePlayerName])
  }

  reload() {
    this.updateRooms();
  }
}
