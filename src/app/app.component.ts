import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {GapTextCardComponent} from "./components/gap-text-card/gap-text-card.component";
import {AnswerTextCardComponent} from "./components/answer-text-card/answer-text-card.component";
import {HttpClientModule} from "@angular/common/http";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatCardModule,
    MatButtonModule,
    GapTextCardComponent,
    AnswerTextCardComponent,
    HttpClientModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  //
  // @HostListener('window:beforeunload', ['$event'])
  // public beforeUnloadHandler(event: any) {
  //   event.preventDefault();
  // }
  //
  // @HostListener('window:onload', ['$event'])
  // public onload(event: any) {
  //   event.preventDefault();
  // }

}
