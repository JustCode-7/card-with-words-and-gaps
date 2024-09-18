import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {SocketService} from "../service/socket.service";
import {BackendService} from "../service/backend.service";
import {Subscription} from "rxjs";
import {UserService} from "../service/user.service";
import {Player} from "@cards-with-words-and-gaps/shared/dist/model/player";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-player-list',
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
        </li>
      }
    </ul>
  `,
  styles: ``
})
export class PlayerListComponent implements OnInit, OnDestroy {
  players = signal<Player[]>([])

  user = inject(UserService).getUser()

  private route = inject(ActivatedRoute)
  private backend = inject(BackendService)
  private socket = inject(SocketService)

  private sub: Subscription | undefined

  ngOnInit() {
    const roomId = this.route.snapshot.parent?.paramMap.get('room')!
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
