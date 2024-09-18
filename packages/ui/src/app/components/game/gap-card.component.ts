import {Component, computed, inject, input, OnDestroy, OnInit, signal} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {Card} from "@cards-with-words-and-gaps/shared/dist/model/card";
import {Subscription} from "rxjs";
import {BackendService} from "../../service/backend.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-gap-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule
  ],
  template: `
    <h4>Catlord Card</h4>
    <mat-card appearance="outlined">
      <mat-card-content>
        {{ textFirstPart() }}

        <code class="border border-white">1</code>
        <span class="border border-white m-1 p-1">{{ firstCard().text }}</span>

        {{ textSecondPart() }}

        @if (hasSecondGap()) {
          <code class="border border-white">2</code>
          <span class="border border-white m-1 p-1">{{ secondCard().text }}</span>

          {{ textThirdPart() }}
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: ``
})
export class GapCardComponent implements OnInit, OnDestroy {

  gapCard = signal<Card>({id: '', text: 'This is just a placeholder for ___ .'})
  firstCard = input<Card>({id: '', text: '___'})
  secondCard = input<Card>({id: '', text: '___'})

  textFirstPart = computed(() => this.gapCard().text.split('___')[0]);
  textSecondPart = computed(() => this.gapCard().text.split('___')[1]);
  hasSecondGap = computed<boolean>(() => this.gapCard().text.split('___').length === 3)
  textThirdPart = computed(() => this.hasSecondGap() && this.gapCard().text.split('___')[2]);

  private backend = inject(BackendService)
  private route = inject(ActivatedRoute)

  private subs: Subscription[] = []

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('room')!;
    const sub = this.backend.getGapCard(roomId)
      .subscribe(({gapCard}) => this.gapCard.set(gapCard))
    this.subs.push(sub)
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe())
  }

}
