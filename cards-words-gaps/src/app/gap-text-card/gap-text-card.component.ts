import {Component} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-gap-text-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './gap-text-card.component.html',
  styleUrl: './gap-text-card.component.scss'
})
export class GapTextCardComponent {

}
