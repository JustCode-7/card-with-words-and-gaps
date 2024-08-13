import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
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
      <form [formGroup]="form">
        <mat-form-field>
          <mat-label>Raum</mat-label>
          <input matInput formControlName="room" required maxlength="32" pattern="[a-zA-Z0-9-]*">
          @if (form.controls.room.invalid) {
            <mat-error>Name must match regex [a-zA-Z0-9-]*</mat-error>
          }
        </mat-form-field>
        <button class="ms-3"
                mat-button
                [disabled]="form.invalid"
                color="accent"
                aria-label="Create Room"
                type="submit"
                (click)="createRoom()">
          <mat-icon>add</mat-icon>
          Create Room
        </button>
      </form>
    </div>
  `,
  styles: ``
})
export class RoomCreateComponent {

  form = new FormGroup({
    room: new FormControl('', [Validators.required, Validators.maxLength(32), Validators.pattern('[a-zA-Z0-9-]*')]),
  })

  private socketService = inject(SocketService);

  createRoom() {
    if (this.form.valid) {
      const room = this.form.value.room!;
      this.socketService.createRoom(room);
    }
  }

}
