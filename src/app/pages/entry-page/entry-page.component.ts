import {Component, inject} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {RouterLink} from "@angular/router";
import {MatchService} from "../../service/match.service";

@Component({
  selector: 'app-entry-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './entry-page.component.html',
  styleUrl: './entry-page.component.scss'
})
export class EntryPageComponent {


  protected readonly inject = inject;
  protected readonly MatchService = MatchService;
}
