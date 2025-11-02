import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import * as QRCode from 'qrcode';
import * as JSZip from 'jszip';
import { ObservationService } from './services/observation.service';
import { firstValueFrom } from 'rxjs';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
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
        <a href="#" (click)="openQr($event)">Share</a>
        <a href="#" (click)="exportCompendium($event)" [class.disabled]="exporting">Export</a>
        <span class="flex-spacer"></span>
        <a href="https://github.com/danielhood/microlandia-compendium" target="_blank" rel="noopener" class="icon-link" aria-label="GitHub">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z"/>
          </svg>
        </a>
      </nav>
    </header>
    <main>
      <div class="qr-overlay" *ngIf="qrOpen" (click)="closeQr()">
        <div class="qr-modal" (click)="$event.stopPropagation()">
          <ng-container *ngIf="qrImgSrc; else generating">
            <img [src]="qrImgSrc" alt="Share QR" />
          </ng-container>
          <ng-template #generating>
            <div class="qr-generating">Generating QR…</div>
          </ng-template>
          <div class="qr-caption">Scan to open the Microlandia Compendium</div>
          <button class="close-btn" type="button" (click)="closeQr()" aria-label="Close">Close</button>
        </div>
      </div>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  constructor(private svc: ObservationService) {}
  qrOpen = false;
  shareUrl = environment.shareQrUrl;
  qrImgSrc = '';
  exporting = false;

  async openQr(ev: Event) {
    ev.preventDefault();
    this.qrOpen = true;
    this.qrImgSrc = '';
    try {
      this.qrImgSrc = await QRCode.toDataURL(this.shareUrl, {
        width: 320,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch (e) {
      console.error('QR generation failed', e);
    }
  }
  closeQr() { this.qrOpen = false; }

  private csvEscape(val: any): string {
    const s = val == null ? '' : String(val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  async exportCompendium(ev: Event) {
    ev.preventDefault();
    if (this.exporting) return;
    this.exporting = true;
    try {
      const items = await firstValueFrom(this.svc.listAll());
      const JSZipCtor: any = (JSZip as any);
      const zip = new JSZipCtor();
      const images = zip.folder('images');
      const headers = ['_id','researcherName','commonName','scientificName','habitat','fieldNotes','createdAt','updatedAt','imagePath'];
      const rows = [headers.join(',')];
      const jsonOut: any[] = [];
      items.forEach((o, idx) => {
        const id = (o as any)._id || String(idx + 1);
        let imagePath = '';
        if ((o as any).imageData) {
          const b64 = String((o as any).imageData).split(',')[1] || '';
          imagePath = `images/${id}.png`;
          images.file(`${id}.png`, b64, { base64: true });
        }
        const row = [
          id,
          (o as any).researcherName,
          (o as any).commonName,
          (o as any).scientificName,
          (o as any).habitat,
          (o as any).fieldNotes,
          (o as any).createdAt,
          (o as any).updatedAt,
          imagePath
        ].map(v => this.csvEscape(v)).join(',');
        rows.push(row);

        // JSON record: include DB fields and relative imagePath, omit large imageData
        jsonOut.push({
          _id: id,
          researcherName: (o as any).researcherName ?? '',
          commonName: (o as any).commonName ?? '',
          scientificName: (o as any).scientificName ?? '',
          habitat: (o as any).habitat ?? '',
          fieldNotes: (o as any).fieldNotes ?? '',
          createdAt: (o as any).createdAt ?? '',
          updatedAt: (o as any).updatedAt ?? '',
          imagePath
        });
      });
      zip.file('compendium.csv', rows.join('\n'));
      zip.file('compendium.json', JSON.stringify(jsonOut, null, 2));
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0,10);
      a.download = `microlandia-compendium-${date}.zip`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      this.exporting = false;
    }
  }
}
