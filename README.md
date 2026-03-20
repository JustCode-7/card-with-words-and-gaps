# CardsWordsGaps

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.8.

## Getting Started

Um das Spiel lokal zu starten, müssen sowohl der Frontend- als auch der Backend-Server laufen.

### Einfacher Start (beide Server gleichzeitig)

Führe folgenden Befehl im Verzeichnis `cards-words-gaps` aus:

```bash
npm run dev
```

Dies startet sowohl das Backend (Port 3000) als auch den Angular-Dev-Server (Port 4200) in **einem einzigen Terminal**. Du siehst die Logs beider Prozesse farblich markiert.

### Fehlerbehebung: "ECONNREFUSED"

Wenn du diesen Fehler in der Konsole siehst, bedeutet das meistens, dass der Backend-Server (Port 3000) nicht läuft.

1. Stelle sicher, dass du `npm run dev` benutzt hast.
2. Prüfe, ob in deinem Terminal Fehlermeldungen vom Backend stehen (gelb/grün markiert mit `[backend]`).
3. Falls `npm run dev` fehlschlägt, versuche die Server manuell in zwei getrennten Terminals zu starten.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
