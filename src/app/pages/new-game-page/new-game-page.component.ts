import {Component} from '@angular/core';
import {RoomCreateComponent} from "../../components/room-create/room-create.component";

@Component({
  selector: 'app-new-game-page',
  standalone: true,
  imports: [
    RoomCreateComponent
  ],
  template: `
    <app-room-create/>
  `,
})
export class NewGamePage {
}
