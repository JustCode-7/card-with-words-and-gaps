import {Component, inject} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {DataService} from "../../service/data.service";
import {MatCardModule} from "@angular/material/card";
import {RouterLink} from "@angular/router";
import {PlayerService} from "../../service/player.service";

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RouterLink
  ],
  template: `
    <h1>List of existing Rooms</h1>
    @for (room of rooms(); track room) {
      <mat-card>
        <mat-card-content>
          {{ room }}
          <button mat-button
                  color="primary"
                  aria-label="Join"
                  routerLink="/game/{{ room }}/{{playerService.getPlayer().name}}"
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
  styles: ``
})
export class RoomListComponent {
  protected playerService = inject(PlayerService);
  private data = inject(DataService);
  rooms = this.data.roomListSignal;
}
