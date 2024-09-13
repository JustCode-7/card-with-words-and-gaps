import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {BackendService} from "../../service/backend.service";
import {UserService} from "../../service/user.service";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {MatCardModule} from "@angular/material/card";
import {CatlordComponent} from "../catlord/catlord.component";
import {Player} from "@cards-with-words-and-gaps/shared/dist/model/player";

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    MatCardModule,
    CatlordComponent
  ],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        @if (isCatlord()) {
          You are the the catlord.
        } @else {
          The Catlord is {{ catlord().name }}
        }
      </mat-card-content>
    </mat-card>
    @if (isCatlord()) {
      <app-catlord/>
    }

  `,
  styles: ``
})
export class GameComponent implements OnInit, OnDestroy {

  catlord = signal<Player>({id: '', name: ''})
  isCatlord = computed<boolean>(() => this.catlord().id == this.user.getUser().id)

  private backend = inject(BackendService)
  private user = inject(UserService)
  private route = inject(ActivatedRoute)
  private sub: Subscription | undefined

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('room')!;
    this.sub = this.backend.getCatlord(roomId)
      .subscribe(({catlord}) => this.catlord.set(catlord))
  }

  ngOnDestroy() {
    this.sub?.unsubscribe()
  }
}
