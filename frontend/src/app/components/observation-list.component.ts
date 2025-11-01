import { Component, OnInit, inject } from '@angular/core';
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

      <form (ngSubmit)="search()" style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
        <input [(ngModel)]="filters.researcherName" name="researcherName" placeholder="Researcher Name" />
        <input [(ngModel)]="filters.commonName" name="commonName" placeholder="Common Name" />
        <input [(ngModel)]="filters.scientificName" name="scientificName" placeholder="Scientific Name" />
        <input [(ngModel)]="filters.habitat" name="habitat" placeholder="Habitat" />
        <input [(ngModel)]="filters.q" name="q" placeholder="Search notes" />
        <div class="actions">
          <button type="submit">Search</button>
          <button type="button" (click)="reset()">Reset</button>
          <a routerLink="/new"><button type="button">Add New</button></a>
        </div>
      </form>

      <table *ngIf="observations.length; else empty">
        <thead>
          <tr>
            <th>Researcher</th>
            <th>Common Name</th>
            <th>Scientific Name</th>
            <th>Habitat</th>
            <th>Field Notes</th>
            <th style="width: 150px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of observations">
            <td>{{ o.researcherName }}</td>
            <td>{{ o.commonName }}</td>
            <td><i>{{ o.scientificName }}</i></td>
            <td>{{ o.habitat }}</td>
            <td>{{ o.fieldNotes }}</td>
            <td class="actions">
              <button (click)="remove(o)" title="Delete">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <ng-template #empty>
        <p>No observations found.</p>
      </ng-template>
    </section>
  `
})
export class ObservationListComponent implements OnInit {
  private svc = inject(ObservationService);
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
}

