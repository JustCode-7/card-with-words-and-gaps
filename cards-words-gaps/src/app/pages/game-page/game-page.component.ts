import {Component, inject} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [],
  template: `
    <div class="container">
      <h1>Cats against humanity // Room: {{ route.snapshot.paramMap.get('room') }}</h1>
      <p>
        game-page works!
      </p>
    </div>
  `,
  styles: ``
})
export class GamePage {
  route = inject(ActivatedRoute);
}
