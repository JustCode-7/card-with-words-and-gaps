import {Component} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-card-editor-page',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink],
  template: `
    <div class="center-content mt-3">
      <h2>Karten bearbeiten</h2>
    </div>
    <mat-card class="mt-3">
      <mat-card-header class="center-content">
        <mat-card-title>Lückentexte</mat-card-title>
      </mat-card-header>
      <mat-card-content class="center-content">
        <p>Hier kannst du die Karten mit den Lückentexten bearbeiten.</p>
      </mat-card-content>
      <mat-card-actions class="center-content">
        <button mat-raised-button color="primary" [routerLink]="['/edit-cards/gaps']">Lückentexte bearbeiten</button>
      </mat-card-actions>
    </mat-card>

    <mat-card class="mt-3">
      <mat-card-header class="center-content">
        <mat-card-title>Antworten</mat-card-title>
      </mat-card-header>
      <mat-card-content class="center-content">
        <p>Hier kannst du die Antwortkarten bearbeiten.</p>
      </mat-card-content>
      <mat-card-actions class="center-content">
        <button mat-raised-button color="primary" [routerLink]="['/edit-cards/answers']">Antworten bearbeiten</button>
      </mat-card-actions>
    </mat-card>

    <div class="center-content mt-3">
      <button mat-stroked-button [routerLink]="['/']">Zurück</button>
    </div>
  `
})
export class CardEditorPageComponent {
}
