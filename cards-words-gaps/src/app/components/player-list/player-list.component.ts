import {Component, inject, OnDestroy, OnInit, output, signal} from '@angular/core';
import {SocketService} from "../../service/socket.service";
import {Player} from "../../model/player";
import {BackendService} from "../../service/backend.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {UserService} from "../../service/user.service";

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [],
  template: `
    <h2>Players</h2>
    <ul>
      @for (player of players(); track player.id) {
        <li>
          @if (player.id == user.id) {
            <strong>{{ player.name }}</strong> (this is me)
          } @else {
            {{ player.name }}
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
  onPlayerCount = output<number>()

  private socket = inject(SocketService)
  private backend = inject(BackendService)
  private route = inject(ActivatedRoute)

  private sub: Subscription | undefined

  private roomPlayerListener(players: Player[]) {
    this.players.set(players)
    this.onPlayerCount.emit(players.length)
  }

  ngOnInit() {
    const roomId = this.route.snapshot.parent?.paramMap.get('room')!
    this.sub = this.backend.getPlayers(roomId).subscribe(players => {
      this.players.set(players)
      this.onPlayerCount.emit(players.length)
    })
    this.socket.socket.on('room-players', this.roomPlayerListener.bind(this));
  }

  ngOnDestroy() {
    this.socket.socket.off('room-players', this.roomPlayerListener.bind(this));
    this.sub?.unsubscribe()
  }

}
