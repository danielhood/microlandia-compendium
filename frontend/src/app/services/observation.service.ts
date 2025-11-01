import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Observation } from '../models/observation';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ObservationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl + '/observations';
  private apiRoot = environment.apiBaseUrl;
  constructor() {
    // Debug: verify which API base URL the app is using at runtime
    console.log('[ObservationService] API base URL:', this.baseUrl);
  }

  list(filters?: Partial<Observation> & { q?: string }): Observable<Observation[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v != null && v !== '') params = params.set(k, String(v));
      });
    }
    return this.http.get<Observation[]>(this.baseUrl, { params });
  }

  create(observation: Observation): Observable<Observation> {
    return this.http.post<Observation>(this.baseUrl, observation);
  }

  get(id: string): Observable<Observation> {
    return this.http.get<Observation>(`${this.baseUrl}/${id}`);
  }

  update(id: string, observation: Observation): Observable<Observation> {
    return this.http.put<Observation>(`${this.baseUrl}/${id}`, observation);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listResearchers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiRoot}/researchers`);
  }
}
