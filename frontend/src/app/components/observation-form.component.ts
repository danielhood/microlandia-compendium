import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ObservationService } from '../services/observation.service';

@Component({
  selector: 'app-observation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Add Observation</h2>
    <form (ngSubmit)="submit()" class="form-grid">
      <label>
        Researcher Name
        <input [(ngModel)]="model.researcherName" name="researcherName" required />
      </label>
      <label>
        Common Name
        <input [(ngModel)]="model.commonName" name="commonName" required />
      </label>
      <label>
        Scientific Name
        <input [(ngModel)]="model.scientificName" name="scientificName" required />
      </label>
      <label>
        Habitat
        <input [(ngModel)]="model.habitat" name="habitat" required />
      </label>
      <label>
        Field Notes
        <textarea rows="5" [(ngModel)]="model.fieldNotes" name="fieldNotes"></textarea>
      </label>
      <div class="actions">
        <button type="submit">Save</button>
        <button type="button" (click)="cancel()">Cancel</button>
      </div>
    </form>
  `
})
export class ObservationFormComponent {
  private svc = inject(ObservationService);
  private router = inject(Router);

  model: any = {
    researcherName: '',
    commonName: '',
    scientificName: '',
    habitat: '',
    fieldNotes: ''
  };

  submit() {
    this.svc.create(this.model).subscribe(() => this.router.navigateByUrl('/'));
  }

  cancel() { this.router.navigateByUrl('/'); }
}
