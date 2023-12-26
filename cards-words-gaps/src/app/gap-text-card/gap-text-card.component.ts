import {Component, OnInit} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {BehaviorSubject} from "rxjs";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-gap-text-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    AsyncPipe
  ],
  templateUrl: './gap-text-card.component.html',
  styleUrl: './gap-text-card.component.scss'
})
export class GapTextCardComponent implements OnInit{

  cardSet: string[] = [
    "Alles ist besser mit ___.",
    "Warum tut mir alles weh?",
    "Wegen eines PR-Debakels bietet Aldi nun nicht mehr___ an.",
    "Meine Lebensphilosophie:___.",
    "Im siebten Kreis der Hölle müssen die Sünder ___ für alle Ewigkeit ertragen.",
    "Für mehr ___ in der Öffentlichkeit!",
    "IS verspricht Selbstmordattentätern neuerdings ___ statt 72 Jungfrauen.",
    "Ich mochte ___, bevor es cool war.",
    "___: Toll in der Theorie, ein ziemliches Durcheinander in der Praxis.",
    "Probleme mit ___? Versuche es mit ___!",
    "Dank ___ hatte ich ein verlängertes Wochenende.",
    "In ihrem neuen Kinofilm schlägt sich die Eisprinzessin Elsa das erste Mal mit ___ herum.",
    "Mein Plan für die Weltherrschaft beginnt mit ___.",
    "Beim Sex denke ich gerne an ___.",
    "Was ist Liebe ohne ___?",
    "Was brachte die Orgie zu einem schlagartigen Stillstand?",
    "___ ist was Frauen wollen.",
    "Ich habe auf die harte Tour gelernt, dass man einen trauernden Freund nicht mit ___ aufheitern kann.",
    "Woher kommt der Fleck auf meiner Couch?",
    "___ – gefürchtet mit 5, begehrt mit 18.",
    "Ich trinke, um ___ zu vergessen.",
    "Am achten Tag erschuf Gott ___. Er ist seitdem nicht mehr gesehen worden.",
    "Wie kompensiere ich für meinen winzigen Penis?",
    "Dank ___ halte ich meine Beziehung am Laufen.",
    "___ – da muss ich an deine Mutter denken.",
    "___ gibt ___ eine ganz neue Bedeutung.",
    "___ ruiniert unser Land.",
    "In seiner Oster-Ansprache betonte der Papst die Wichtigkeit von ___ als christlichem Wert.",
    "Die AfD fordert in ihrem Wahlprogramm mehr ___ für Deutsche.",
    "Ich liebe den Geruch von ___ am Morgen",
    "___– furchtbare Tragödie oder sexuelle Gelegenheit?",
    "___ führt grundsätzlich zu ___.",
    "Wir haben nichts zu fürchten außer ___ an sich.",
    "Was hat zum Ende meiner letzten Beziehung geführt?",
    "Für was hältst du mich eigentlich?",
    "Um mehr Besucher anzulocken, hat das Deutsche Museum eine interaktive Ausstellung über ___ eröffnet.",
    "Papa, warum weint Mama?",
    "Statt Kohle gibt der Weihnachtsmann bösen Kindern nun ___.",
    "Du hast nicht wirklich gelebt, bis du ___ und ___ zusammen erlebt hast.",
    "In einem Tweet hat Donald Trump ___ für sein Versagen verantwortlich gemacht.",
    "Schritt 1: ___. Schritt 2: ___. Schritt 3: Profit",
    "Ich habe letzte Nacht fünf Stunden mit Internettrollen über ___ gestritten.",
    "Ein Leben ohne ___ist möglich, aber sinnlos.",
    "Um sein Land wieder unter Kontrolle zu bringen, setzt Assad auf ___.",
    "Angela Merkel hat ___ zur Chefsache erklärt."
  ]
  currentCardNr = 0
  cardNumber= parseInt((Math.random() * this.cardSet.length - 1).toFixed());
  currentCard?: BehaviorSubject<string> ;

  ngOnInit(): void {
    this.cardNumber = parseInt((Math.random() * this.cardSet.length - 1).toFixed());
    this.currentCardNr = this.cardNumber;
    this.currentCard = new BehaviorSubject(this.cardSet[this.currentCardNr])
  }


  nextCard() {
    if(this.cardSet.length < 1){
      return;
    }
    if(this.cardSet.length === 1){
      this.currentCardNr = 1;
    }
    this.cardSet.splice(this.currentCardNr,1);
    this.cardNumber = parseInt((Math.random() * this.cardSet.length - 1).toFixed());
    this.currentCardNr = this.cardNumber;
    if(this.cardSet[this.currentCardNr] === undefined){
      this.cardNumber = parseInt((Math.random() * this.cardSet.length - 1).toFixed());
      this.currentCardNr = this.cardNumber;
    }
    this.currentCard?.next(this.cardSet[this.currentCardNr])
    this.changeCardMaster();
  }

  changeCardMaster() {
    // change Master
    this.fillSpielerCardStack()
  }



  showAnswers() {
    console.log("show all")
  }

  fillSpielerCardStack() {
    // randomly fill answer cards for every player to 10
  }
}
