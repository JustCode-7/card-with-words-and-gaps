import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {BackendService} from "../../service/backend.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {Card} from "../../model/card";
import {CardGapTextComponent} from "../card-gap-text/card-gap-text.component";

@Component({
  selector: 'app-catlord',
  standalone: true,
  imports: [
    CardGapTextComponent
  ],
  template: `
    <app-card-gap-text [gapCard]="gapCard()"/>
  `,
  styles: ``
})
export class CatlordComponent implements OnInit, OnDestroy {

  gapCard = signal<Card>({id: '', text: ''})

  private backend = inject(BackendService)
  private route = inject(ActivatedRoute)

  private sub: Subscription | undefined

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('room')!
    this.sub = this.backend.getGapCard(roomId)
      .subscribe(({gapCard}) => this.gapCard.set(gapCard))
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe()
  }


}
