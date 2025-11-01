import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ObservationService } from '../services/observation.service';

@Component({
  selector: 'app-observation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>{{ isEdit ? 'Edit Observation' : 'Add Observation' }}</h2>
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
export class ObservationFormComponent implements OnInit {
  private svc = inject(ObservationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  id: string | null = null;
  model: any = {
    researcherName: '',
    commonName: '',
    scientificName: '',
    habitat: '',
    fieldNotes: ''
  };

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.id;
    if (this.isEdit && this.id) {
      this.svc.get(this.id).subscribe(data => this.model = {
        researcherName: data.researcherName,
        commonName: data.commonName,
        scientificName: data.scientificName,
        habitat: data.habitat,
        fieldNotes: data.fieldNotes ?? ''
      });
    }
  }

  submit() {
    if (this.isEdit && this.id) {
      this.svc.update(this.id, this.model).subscribe(() => this.router.navigateByUrl('/'));
    } else {
      this.svc.create(this.model).subscribe(() => this.router.navigateByUrl('/'));
    }
  }

  cancel() { this.router.navigateByUrl('/'); }
}
