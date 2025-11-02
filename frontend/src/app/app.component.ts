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
