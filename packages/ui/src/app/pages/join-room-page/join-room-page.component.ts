import {Component} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {JoinRoomListComponent} from "../../components/join-room-list.component";
import {CreateRoomComponent} from "../../components/create-room.component";

@Component({
  selector: 'app-join-room-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    JoinRoomListComponent,
    CreateRoomComponent,
  ],
  template: `
    <div class="container">
      <app-join-room-list/>
      <app-create-room/>
    </div>
  `,
  styles: ``
})
export class JoinRoomPage {

}
