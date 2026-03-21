import {Injectable, signal} from '@angular/core';
import {cardSet} from '../data/catlord-cards';
import {answerSet} from '../data/answer-cards';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CardEditorService {
  public cardsUpdated$ = new Subject<void>();
  private readonly GAPS_KEY = 'custom_gaps';
  gaps = signal<string[]>(this.loadCards(this.GAPS_KEY, cardSet));
  private readonly ANSWERS_KEY = 'custom_answers';
  answers = signal<string[]>(this.loadCards(this.ANSWERS_KEY, answerSet));

  saveGaps(newGaps: string[]) {
    this.gaps.set(newGaps);
    localStorage.setItem(this.GAPS_KEY, JSON.stringify(newGaps));
    this.cardsUpdated$.next();
  }

  saveAnswers(newAnswers: string[]) {
    this.answers.set(newAnswers);
    localStorage.setItem(this.ANSWERS_KEY, JSON.stringify(newAnswers));
    this.cardsUpdated$.next();
  }

  resetGaps() {
    this.saveGaps([...cardSet]);
  }

  resetAnswers() {
    this.saveAnswers([...answerSet]);
  }

  private loadCards(key: string, defaultSet: string[]): string[] {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored cards for ' + key, e);
      }
    }
    return [...defaultSet];
  }
}
