import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {NgForOf} from "@angular/common";
import {SocketService} from "../../service/socket.service";
import {RoomListComponent} from "../../components/room-list/room-list.component";
import {RoomCreateComponent} from "../../components/room-create/room-create.component";

@Component({
  selector: 'app-room-overview',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    NgForOf,
    RoomListComponent,
    RoomCreateComponent,
  ],
  template: `
    <div class="container">
      <app-room-list/>
      <app-room-create/>
    </div>
  `,
  styles: ``
})
export class RoomOverviewPage implements OnInit, OnDestroy {

  private socketService = inject(SocketService);

  ngOnInit(): void {
    this.socketService.onRoomListener();
  }

  ngOnDestroy() {
    this.socketService.offRoomListener();
  }

}
