import {Component, inject} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {DataService} from "../../service/data.service";
import {MatCardModule} from "@angular/material/card";
import {Router} from "@angular/router";
import {PlayerService} from "../../service/player.service";
import {SocketService} from "../../service/socket.service";

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <h1>List of existing Rooms</h1>
    @for (room of rooms(); track room) {
      <mat-card class="room-card">
        <mat-card-content>
          <span class="room-name">{{ room }}</span>
          <button mat-button
                  color="primary"
                  aria-label="Join"
                  (click)="joinRoom(room)"
          >
            <mat-icon>rocket_launch</mat-icon>
            Join
          </button>
        </mat-card-content>
      </mat-card>
    } @empty {
      <div>There are no rooms yet.</div>
    }
  `,
  styles: `
    .room-card {
      margin-bottom: 1rem;
    }
    .room-name {
      margin-right: 1rem;
      font-weight: bold;
    }
  `
})
export class RoomListComponent {
  protected playerService = inject(PlayerService);
  private data = inject(DataService);
  private socketService = inject(SocketService);
  private router = inject(Router);

  rooms = this.data.roomListSignal;

  joinRoom(roomId: string) {
    // Join the room through the socket
    this.socketService.joinRoom(roomId);

    // Navigate to the game page
    const playerName = this.playerService.getPlayer().name;
    this.router.navigate(['/game', roomId, playerName]);
  }
}
