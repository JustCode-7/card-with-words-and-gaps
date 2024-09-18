import {Component} from '@angular/core';
import {CardSelectionListComponent} from "./card-selection-list.component";
import {GapCardComponent} from "./gap-card.component";

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [
    CardSelectionListComponent,
    GapCardComponent
  ],
  template: `
    <app-gap-card/>
    <p>
      Please select your cards
    </p>
    <app-card-selection-list/>
  `,
  styles: ``
})
export class PlayerComponent {

}
