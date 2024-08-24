import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatCardModule} from "@angular/material/card";
import {RouterLink} from "@angular/router";
import {BackendService} from "../../service/backend.service";
import {SocketService} from "../../service/socket.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-join-room-list',
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
             [routerLink]="['/game', room, 'waiting-room']"
          >
            <mat-icon>login</mat-icon>
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
export class JoinRoomListComponent implements OnInit, OnDestroy {

  private socketService = inject(SocketService);
  private backend = inject(BackendService);
  private sub: Subscription | undefined

  rooms = signal<string[]>([])

  ngOnInit(): void {
    this.sub = this.backend.getRoomIdList().subscribe(rooms => this.rooms.set(rooms));
    this.socketService.socket.on("room-list", this.roomListener.bind(this))
  }

  ngOnDestroy() {
    this.sub?.unsubscribe()
    this.socketService.socket.off("room-list", this.roomListener.bind(this))
  }

  private roomListener(roomList: string[]) {
    this.rooms.set(roomList);
  }
}
