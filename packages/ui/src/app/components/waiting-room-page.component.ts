import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {PlayerListComponent} from "./player-list.component";
import {MatButton} from "@angular/material/button";
import {SocketService} from "../service/socket.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [
    PlayerListComponent,
    MatButton,
    MatIcon
  ],
  template: `
    <app-player-list/>
    <p>Are you ready to start the game?</p>
    <button mat-stroked-button
            (click)="startGame()"
    >
      <mat-icon>rocket_launch</mat-icon>
      Start Game
    </button>
  `,
  styles: ``
})
export class WaitingRoomComponent implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute)
  private socket = inject(SocketService)
  private router = inject(Router)

  ngOnInit(): void {
    this.socket.socket.on('start-game', this.startGameListener.bind(this))
  }

  ngOnDestroy(): void {
    this.socket.socket.off('start-game', this.startGameListener.bind(this))
  }

  private startGameListener() {
    console.log('received start game command')
    this.router.navigate(['..'], {relativeTo: this.route})
  }

  startGame() {
    const roomId = this.route.snapshot.parent?.paramMap.get('room')!
    this.socket.socket.emit('start-game', roomId)
  }

}
