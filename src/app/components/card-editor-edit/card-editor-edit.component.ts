import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {CardEditorService} from '../../service/card-editor.service';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';

@Component({
  selector: 'app-card-editor-edit',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    RouterLink,
    MatSnackBarModule
  ],
  template: `
    <div class="center-content mt-3">
      <h2>{{ isGaps ? 'Lückentexte' : 'Antworten' }} bearbeiten</h2>
    </div>
    <mat-card class="mt-3">
      <mat-card-content>
        <p>Geben Sie pro Zeile einen Eintrag ein.</p>
        <mat-form-field class="full-width" appearance="outline">
          <mat-label>{{ isGaps ? 'Lückentexte' : 'Antworten' }}</mat-label>
          <textarea matInput
                    [(ngModel)]="textValue"
                    rows="15"
                    placeholder="Ein Eintrag pro Zeile..."></textarea>
        </mat-form-field>
      </mat-card-content>
      <mat-card-actions class="center-content">
        <button mat-raised-button color="primary" (click)="save()">Speichern</button>
        <button mat-button (click)="reset()">Zurücksetzen</button>
      </mat-card-actions>
    </mat-card>
    <div class="center-content mt-3">
      <button mat-stroked-button [routerLink]="['/edit-cards']">Abbrechen</button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class CardEditorEditComponent implements OnInit {
  isGaps = false;
  textValue = '';
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardEditorService = inject(CardEditorService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.isGaps = this.router.url.includes('/edit-cards/gaps');
    const cards = this.isGaps ? this.cardEditorService.gaps() : this.cardEditorService.answers();
    this.textValue = cards.join('\n');
  }

  save() {
    const newCards = this.textValue.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (this.isGaps) {
      this.cardEditorService.saveGaps(newCards);
    } else {
      this.cardEditorService.saveAnswers(newCards);
    }

    this.snackBar.open('Karten erfolgreich gespeichert!', 'OK', {duration: 3000});
    this.router.navigate(['/edit-cards']);
  }

  reset() {
    if (confirm('Möchten Sie wirklich alle Karten auf den Standard zurücksetzen?')) {
      if (this.isGaps) {
        this.cardEditorService.resetGaps();
        this.textValue = this.cardEditorService.gaps().join('\n');
      } else {
        this.cardEditorService.resetAnswers();
        this.textValue = this.cardEditorService.answers().join('\n');
      }
      this.snackBar.open('Karten wurden zurückgesetzt.', 'OK', {duration: 3000});
    }
  }
}
