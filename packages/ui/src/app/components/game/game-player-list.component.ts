import {Component, inject, input, OnDestroy, OnInit, signal} from '@angular/core';
import {Subscription} from "rxjs";
import {emptyPlayer, Player} from "@cards-with-words-and-gaps/shared/dist/model/player";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {UserService} from "../../service/user.service";
import {SocketService} from "../../service/socket.service";
import {BackendService} from "../../service/backend.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-game-player-list',
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <h4>Players</h4>
    <ul>
      @for (player of players(); track player.id) {
        <li>

          {{ player.name }}
          @if (player.id == user.id) {
            <mat-icon matTooltip="You">person</mat-icon>
          }
          @if (player.id === catlord().id) {
            <mat-icon matTooltip="Catlord">pets</mat-icon>
          }
          @if (true) {
            <mat-icon fontSet="material-icons-outlined" matTooltip="cards pending">circle</mat-icon>
          } @else {
            <mat-icon fontSet="material-icons-outlined" matTooltip="cards submitted">check_circle</mat-icon>
          }
        </li>
      }
    </ul>
  `,
  styles: ``
})
export class GamePlayerListComponent implements OnInit, OnDestroy {
  catlord = input<Player>(emptyPlayer())

  players = signal<Player[]>([])

  user = inject(UserService).getUser()
  private socket = inject(SocketService)
  private backend = inject(BackendService)
  private route = inject(ActivatedRoute)

  private sub: Subscription | undefined

  ngOnInit() {
    const roomId = this.route.snapshot.paramMap.get('room')!;
    this.sub = this.backend.getPlayers(roomId).subscribe(players => {
      this.players.set(players)
    })
    this.socket.socket.on('room-players', this.roomPlayerListener.bind(this));
  }

  ngOnDestroy() {
    this.socket.socket.off('room-players', this.roomPlayerListener.bind(this));
    this.sub?.unsubscribe()
  }

  private roomPlayerListener(players: Player[]) {
    this.players.set(players)
  }

}
