import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {NgForOf} from "@angular/common";
import {SocketService} from "../../service/socket.service";

@Component({
  selector: 'app-join-game',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    NgForOf
  ],
  templateUrl: './join-game-page.component.html',
  styleUrl: './join-game-page.component.scss'
})
export class JoinGamePageComponent implements OnInit, OnDestroy {

  private socketService = inject(SocketService);

  rooms = this.socketService.rooms$;

  form = new FormGroup({
    room: new FormControl("", [Validators.required]),
  })

  newRoomControl = new FormControl('', [Validators.required, Validators.maxLength(32)])

  ngOnInit(): void {
    this.socketService.onRoomListener();
  }

  ngOnDestroy() {
    this.socketService.offRoomListener();
  }

  createRoom() {
    const room = this.newRoomControl.value!;
    this.socketService.createRoom(room);
  }

  onSubmit() {
    console.log(this.form.value);
    // TODO continue here
  }


  // protected updateRooms() {
  //   this.socketService.sendRoomID('getRoomID', 'giveMeRoomID');
  //   this.socketService.getRoomID().subscribe(values => {
  //     values.forEach(value => {
  //       if (!this.roomIds.value.some(currentValue => currentValue === value)) {
  //         this.roomIds.value.push(value)
  //       }
  //     })
  //   })
  // }

  // joinGame(valuePlayerName: string, roomid: string) {
  //   this.socketService.sendRoomID('joinRoomID', roomid)
  //   console.log("Joind Room: " + roomid)
  //   this.socketService.getGame().subscribe({
  //     next: gamefromBE => {
  //       if (valuePlayerName.length > 0 && gamefromBE !== undefined) {
  //         const free = gamefromBE.spieler.find((value: Spieler) => value.name.toLowerCase().includes("dude"))
  //         console.log("Free Bot" + free?.name)
  //         gamefromBE
  //           .spieler
  //           .forEach((player: Spieler) => {
  //             if (player === free) {
  //               player.name = valuePlayerName;
  //               console.log("Player JOINED")
  //               console.log(player)
  //             }
  //           })
  //       }
  //       this.matchService.game.next(gamefromBE);
  //       this.socketService.sendUpdateGame('updateGame', this.matchService.game.value)
  //       console.log(this.matchService.game.value)
  //     }
  //   });
  //
  //
  //   this.router.navigate(['/game', roomid, valuePlayerName])
  // }

  // reload() {
  //   this.updateRooms();
  // }
}
