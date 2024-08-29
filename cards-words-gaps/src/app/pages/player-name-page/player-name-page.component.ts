import {Component, inject, OnInit} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {UserService} from "../../service/user.service";
import {MatIconModule} from "@angular/material/icon";
import {Router} from "@angular/router";

@Component({
  selector: 'app-player-name-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="container">
      <h1>Willkommen zum <code>Banana Kittens</code> Kartenspiel</h1>

      <h3>Wie heisst du?</h3>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input maxlength="32"
                 matInput type="text"
                 required
                 formControlName="name"
          />
          @if (form.controls['name'].dirty && form.controls['name'].invalid) {
            <mat-error>Please provide a name</mat-error>
          }
        </mat-form-field>

        <button type="submit"
                [disabled]="form.invalid"
                mat-stroked-button
                color="error"
        >
          <mat-icon>chevron_right</mat-icon>
          Next
        </button>
      </form>
    </div>
  `,
  styles: ``
})
export class PlayerNamePage implements OnInit {
  private playerService = inject(UserService);
  private router = inject(Router);

  form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(32)]),
  })

  ngOnInit() {
    const {name} = this.playerService.getUser();
    this.form.patchValue({name})
  }

  onSubmit() {
    const {name} = this.form.value;
    this.playerService.setName(name);

    this.router.navigate(['/join-game'])
  }
}
