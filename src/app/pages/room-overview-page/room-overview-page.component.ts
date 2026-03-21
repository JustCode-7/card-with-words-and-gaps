import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {SocketService} from "../../service/socket.service";
import {RoomListComponent} from "../../components/room-list/room-list.component";
import {RoomCreateComponent} from "../../components/room-create/room-create.component";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-room-overview',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    RoomListComponent,
    RoomCreateComponent,
    AsyncPipe,
  ],
  template: `
    <app-room-create/>
    @if (!(socketService.isHost | async)) {
      <app-room-list/>
    }
  `,
})
export class RoomOverviewPage implements OnInit, OnDestroy {

  socketService = inject(SocketService);

  ngOnInit(): void {
    this.socketService.onRoomListener();
  }

  ngOnDestroy() {
    this.socketService.offRoomListener();
  }

}
