import { Routes } from '@angular/router';
import { ObservationListComponent } from './components/observation-list.component';
import { ObservationFormComponent } from './components/observation-form.component';

export const routes: Routes = [
  { path: '', component: ObservationListComponent },
  { path: 'new', component: ObservationFormComponent },
  { path: 'edit/:id', component: ObservationFormComponent },
  { path: '**', redirectTo: '' }
];
