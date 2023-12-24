import {Component} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-answer-text-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './answer-text-card.component.html',
  styleUrl: './answer-text-card.component.scss'
})
export class AnswerTextCardComponent {

}
