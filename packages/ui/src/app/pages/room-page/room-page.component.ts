import {Component, computed, inject, signal} from '@angular/core';
import {ActivatedRoute, RouterOutlet} from "@angular/router";
import {CardSelectionListComponent} from "../../components/card-selection-list/card-selection-list.component";
import {CardGapTextComponent} from "../../components/card-gap-text/card-gap-text.component";
import {PlayerListComponent} from "../../components/player-list/player-list.component";
import {UserService} from "../../service/user.service";
import {Card, emptyCard} from "@cards-with-words-and-gaps/shared/dist/model/card";

@Component({
  selector: 'app-room-page',
  standalone: true,
  imports: [
    CardSelectionListComponent,
    CardGapTextComponent,
    PlayerListComponent,
    RouterOutlet
  ],
  template: `
    <div class="container">
      <h1>Cats Against Humanity</h1>
      <p>
        User: <strong>{{ user.getUser().name }}</strong> //
        Room: <strong>{{ route.snapshot.paramMap.get('room') }}</strong>
      </p>
      <app-player-list/>
      <router-outlet/>
      <!--      <app-card-gap-text-->
      <!--        [gapCard]="gapCard()"-->
      <!--        [showSecondGap]="hasSecondGap()"-->
      <!--        [firstCard]="firstCard()"-->
      <!--        [secondCard]="secondCard()"-->
      <!--      />-->
      <!--      <app-card-selection-list-->
      <!--        [showButtonTwo]="hasSecondGap()"-->
      <!--        (onFirstChoice)="firstCard.set($event)"-->
      <!--        (onSecondChoice)="secondCard.set($event)"-->
      <!--      />-->
    </div>
  `,
  styles: ``
})
export class RoomPage {
  route = inject(ActivatedRoute);
  user = inject(UserService)

  firstCard = signal<Card>({...emptyCard, text: '___'})
  secondCard = signal<Card>({...emptyCard, text: '___'})

  gapCard = signal<Card>({id: '', text: 'Welcome home son of ___, did you really ___ ?'})
  hasSecondGap = computed(() => this.gapCard().text.split('___').length === 3)
}
