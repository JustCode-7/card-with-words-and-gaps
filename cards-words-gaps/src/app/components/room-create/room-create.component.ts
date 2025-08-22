import {Component, inject} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatChipsModule} from "@angular/material/chips";
import {AsyncPipe} from "@angular/common";
import {SocketService} from "../../service/socket.service";

@Component({
  selector: 'app-room-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatChipsModule,
    AsyncPipe
  ],
  template: `
    <h2>Einen neuen Raum erstellen:</h2>
    <div>
      <mat-form-field>
        <mat-label>Raum</mat-label>
        <input matInput [formControl]="roomIdControl" required maxlength="32">
      </mat-form-field>
      <button class="ms-3"
              mat-button
              color="accent"
              aria-label="Create Room"
              (click)="createRoom()"
              [disabled]="roomIdControl.invalid">
        <mat-icon>add</mat-icon>
        Create Room
      </button>
    </div>

    @if (socketService.isHost | async) {
      <div class="mt-3">
        <mat-chip color="primary" selected>
          <mat-icon>dns</mat-icon>
          Du bist der Host dieses Raums
        </mat-chip>
        <p class="mt-2">Als Raumersteller bist du der Host und der Server läuft auf deinem Gerät.
        Bitte verlasse den Raum nicht, solange andere Spieler noch darin sind.</p>
      </div>
    }
  `,
  styles: `
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
  `
})
export class RoomCreateComponent {

  roomIdControl = new FormControl('', [Validators.required, Validators.maxLength(32)])
  socketService = inject(SocketService);

  createRoom() {
    if (this.roomIdControl.invalid) return;

    const room = this.roomIdControl.value!;
    this.socketService.createRoom(room);

    // Clear the input after creating the room
    this.roomIdControl.reset();
  }

}
