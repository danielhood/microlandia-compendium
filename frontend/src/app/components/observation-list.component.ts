import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ObservationService } from '../services/observation.service';
import { Observation } from '../models/observation';

@Component({
  selector: 'app-observation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section>
      <h2>Observations</h2>

      <details class="search-panel">
        <summary>Search</summary>
        <form (ngSubmit)="search()" class="search-form">
          <input [(ngModel)]="filters.researcherName" name="researcherName" placeholder="Researcher Name" />
          <input [(ngModel)]="filters.commonName" name="commonName" placeholder="Common Name" />
          <input [(ngModel)]="filters.scientificName" name="scientificName" placeholder="Scientific Name" />
          <input [(ngModel)]="filters.habitat" name="habitat" placeholder="Habitat" />
          <input [(ngModel)]="filters.q" name="q" placeholder="Search notes" />
          <div class="actions">
            <button type="submit">Search</button>
            <button type="button" (click)="reset()">Reset</button>
          </div>
        </form>
      </details>

      <div class="table-scroll" *ngIf="observations.length; else empty">
        <table>
          <thead>
            <tr>
              <th>Common Name</th>
              <th>Scientific Name</th>
              <th>Researcher</th>
            </tr>
          </thead>
          <tbody>
            <tr class="clickable-row" *ngFor="let o of observations" (click)="edit(o)">
              <td>{{ o.commonName }}</td>
              <td><i>{{ o.scientificName }}</i></td>
              <td>{{ o.researcherName }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #empty>
        <p>No observations found.</p>
      </ng-template>
    </section>
  `
})
export class ObservationListComponent implements OnInit {
  private svc = inject(ObservationService);
  private router = inject(Router);
  observations: Observation[] = [];
  filters: any = { researcherName: '', commonName: '', scientificName: '', habitat: '', q: '' };

  ngOnInit(): void {
    this.load();
  }

  load() {
    const active: any = {};
    Object.entries(this.filters).forEach(([k, v]) => { if (v) active[k] = v; });
    this.svc.list(active).subscribe(data => this.observations = data);
  }

  search() { this.load(); }

  reset() {
    this.filters = { researcherName: '', commonName: '', scientificName: '', habitat: '', q: '' };
    this.load();
  }

  remove(o: Observation) {
    if (!o._id) return;
    if (confirm('Delete this observation?')) {
      this.svc.delete(o._id).subscribe(() => this.load());
    }
  }

  edit(o: Observation) {
    if (!o._id) return;
    this.router.navigate(['/edit', o._id]);
  }
}
