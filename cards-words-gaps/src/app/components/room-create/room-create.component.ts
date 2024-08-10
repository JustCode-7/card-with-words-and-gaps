import {Component, inject} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {SocketService} from "../../service/socket.service";

@Component({
  selector: 'app-room-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
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
              (click)="createRoom()">
        <mat-icon>add</mat-icon>
        Create Room
      </button>
    </div>
  `,
  styles: ``
})
export class RoomCreateComponent {

  roomIdControl = new FormControl('', [Validators.required, Validators.maxLength(32)])
  private socketService = inject(SocketService);

  createRoom() {
    const room = this.roomIdControl.value!;
    this.socketService.createRoom(room);
  }

}
