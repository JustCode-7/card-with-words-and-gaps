import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {GapTextCardComponent} from "./components/gap-text-card/gap-text-card.component";
import {AnswerTextCardComponent} from "./components/answer-text-card/answer-text-card.component";

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

// TODO: `HttpClientModule` should not be imported into a component directly.
// Please refactor the code to add `provideHttpClient()` call to the provider list in the
// application bootstrap logic and remove the `HttpClientModule` import from this component.
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
