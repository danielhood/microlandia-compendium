import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header>
      <div class="micro-bg" aria-hidden="true">
        <span class="micro m1"></span>
        <span class="micro m2"></span>
        <span class="micro m3"></span>
        <span class="micro m4"></span>
        <span class="micro m5"></span>
        <span class="micro m6"></span>
        <span class="micro m7"></span>
        <span class="micro m8"></span>
        <span class="micro m9"></span>
        <span class="micro m10"></span>
      </div>
      <h1>Microlandia Compendium</h1>
      <nav>
        <a routerLink="/">Observations</a>
        <a routerLink="/new">Add Observation</a>
      </nav>
    </header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {}
