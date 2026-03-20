import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatButtonModule,

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
