import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import * as QRCode from 'qrcode';
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
  qrOpen = false;
  shareUrl = environment.shareQrUrl;
  qrImgSrc = '';

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
}
