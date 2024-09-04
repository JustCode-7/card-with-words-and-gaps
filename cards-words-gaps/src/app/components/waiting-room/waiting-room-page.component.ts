import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {PlayerListComponent} from "../player-list/player-list.component";
import {MatButton} from "@angular/material/button";
import {SocketService} from "../../service/socket.service";
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
    <app-player-list (onPlayerCount)="playerCount.set($event)"/>
    <p>
      @if (playerCount() < minimumRequiredPlayers) {
        Waiting for {{ minimumRequiredPlayers - playerCount() }} more players to join ...
      } @else {
        Ready to play. The more the merrier.
      }
    </p>
    <button mat-stroked-button
            [disabled]="playerCount() < minimumRequiredPlayers"
            (click)="startGame()"
    >
      <mat-icon>rocket_launch</mat-icon>
      Start Game
    </button>
  `,
  styles: ``
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
  readonly minimumRequiredPlayers = 1
  playerCount = signal<number>(0)

  private socketService = inject(SocketService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  startGame() {
    const roomId = this.route.snapshot.parent?.paramMap.get('room')!
    this.socketService.socket.emit('start-game', roomId)
  }

  ngOnInit(): void {
    this.socketService.socket.on('start-game', this.startGameListener.bind(this))
  }

  ngOnDestroy(): void {
    this.socketService.socket.off('start-game', this.startGameListener.bind(this))
  }

  private startGameListener() {
    console.log('received start game command')
    this.router.navigate(['..'], {relativeTo: this.route})
  }

}
