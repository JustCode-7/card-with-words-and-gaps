import {Component, inject} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {DataService} from "../../service/data.service";
import {MatCardModule} from "@angular/material/card";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RouterLink,
  ],
  template: `
    <h1>List of existing Rooms</h1>
    @for (room of rooms(); track room) {
      <mat-card appearance="outlined">
        <mat-card-content>
          {{ room }}
          <a mat-stroked-button
             color="primary"
             aria-label="Join"
             [routerLink]="['/game', room]"
          >
            <mat-icon>rocket_launch</mat-icon>
            Join
          </a>
        </mat-card-content>
      </mat-card>
    } @empty {
      <div>There are no rooms yet.</div>
    }
  `,
  styles: ``
})
export class RoomListComponent {
  private data = inject(DataService);

  rooms = this.data.roomListSignal;
}
