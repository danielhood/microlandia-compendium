import { Component, ElementRef, ViewChild, inject, OnInit, AfterViewInit } from '@angular/core';
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
    <form (ngSubmit)="submit()" class="form-grid" (document:click)="closePalette()">
      <div class="actions">
        <button type="submit">Save</button>
        <button type="button" (click)="cancel()">Cancel</button>
      </div>
      <div class="form-error" *ngIf="submitted && !isValid()">
        Please fill the required fields: Researcher Name and Common Name.
      </div>
      <label>
        Researcher Name <span class="req">*</span>
        <input [(ngModel)]="model.researcherName" name="researcherName" required
               [class.invalid]="submitted && !(model.researcherName && model.researcherName.trim())" />
        <small class="error-text" *ngIf="submitted && !(model.researcherName && model.researcherName.trim())">Researcher Name is required.</small>
      </label>
      <label>
        Common Name <span class="req">*</span>
        <input [(ngModel)]="model.commonName" name="commonName" required
               [class.invalid]="submitted && !(model.commonName && model.commonName.trim())" />
        <small class="error-text" *ngIf="submitted && !(model.commonName && model.commonName.trim())">Common Name is required.</small>
      </label>
      <label>
        Scientific Name
        <input [(ngModel)]="model.scientificName" name="scientificName" />
      </label>
      <label>
        Habitat
        <input [(ngModel)]="model.habitat" name="habitat" />
      </label>
      <label>
        Field Notes
        <textarea rows="5" [(ngModel)]="model.fieldNotes" name="fieldNotes"></textarea>
      </label>
      <label class="sketch-label">Sketch</label>
      <div class="sketch">
        <div class="sketch-header">
          <div class="sketch-actions">
            <div class="ctl palette" (click)="$event.stopPropagation()">
              <button type="button" class="colour-swatch" (click)="togglePalette($event)" [style.background]="brushColor" aria-label="Choose colour"></button>
              <div class="colour-grid" *ngIf="paletteOpen">
                <button type="button" class="swatch-btn" *ngFor="let c of palette"
                        [style.background]="c" (click)="pickColour(c)"></button>
              </div>
            </div>
            <label class="ctl size">
              <span>Size</span>
              <input #sizeCtl type="range" min="1" max="24" [value]="brushSize" (input)="setSize(sizeCtl.valueAsNumber || +sizeCtl.value)" />
            </label>
            <button type="button" (click)="toggleEraser()" [class.active]="isEraser">Erase</button>
            <button type="button" (click)="clearSketch()">Clear</button>
          </div>
        </div>
        <div class="sketch-canvas-wrap">
          <canvas #sketchCanvas
            (pointerdown)="startDraw($event)"
            (pointermove)="moveDraw($event)"
            (pointerup)="endDraw($event)"
            (pointerleave)="endDraw($event)"
          ></canvas>
        </div>
        <small style="color: var(--muted)">Draw with finger or mouse. Edits layer on top of existing image.</small>
      </div>
    </form>
  `
})
export class ObservationFormComponent implements OnInit, AfterViewInit {
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
    fieldNotes: '',
    imageData: ''
  };

  @ViewChild('sketchCanvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;
  private ctx?: CanvasRenderingContext2D | null;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;
  brushColor = '#ffffff';
  brushSize = 3;
  isEraser = false;
  paletteOpen = false;
  palette: string[] = [
    '#000000','#ffffff','#ef4444','#f59e0b','#fbbf24','#22c55e',
    '#10b981','#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6',
    '#a855f7','#ec4899','#f43f5e','#94a3b8'
  ];
  submitted = false;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.id;
    if (this.isEdit && this.id) {
      this.svc.get(this.id).subscribe(data => {
        this.model = {
          researcherName: data.researcherName ?? '',
          commonName: data.commonName ?? '',
          scientificName: data.scientificName ?? '',
          habitat: data.habitat ?? '',
          fieldNotes: data.fieldNotes ?? '',
          imageData: data.imageData ?? ''
        };
        // Ensure canvas reflects existing image when editing
        setTimeout(() => this.initCanvas(), 0);
      });
    }
    // Default Researcher Name from session for Add flow
    if (!this.isEdit) {
      try {
        const last = sessionStorage.getItem('ml_lastResearcherName');
        if (last && !this.model.researcherName) this.model.researcherName = last;
      } catch {}
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCanvas(), 0);
  }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const parent = canvas.parentElement as HTMLElement;
    const width = parent?.clientWidth || 600;
    const height = 260;
    // Preserve any existing sketch when resizing
    const prev = this.model.imageData;
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.applyBrush();
    if (prev) this.drawImageData(prev);
  }

  private drawImageData(dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      if (!this.ctx || !this.canvasRef) return;
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      this.ctx.drawImage(img, 0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    };
    img.src = dataUrl;
  }

  startDraw(ev: PointerEvent) {
    if (!this.ctx || !this.canvasRef) return;
    this.canvasRef.nativeElement.setPointerCapture(ev.pointerId);
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.lastX = ev.clientX - rect.left;
    this.lastY = ev.clientY - rect.top;
    this.drawing = true;
  }

  moveDraw(ev: PointerEvent) {
    if (!this.drawing || !this.ctx || !this.canvasRef) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }

  endDraw(ev: PointerEvent) {
    if (!this.canvasRef) return;
    this.drawing = false;
    this.canvasRef.nativeElement.releasePointerCapture?.(ev.pointerId);
    this.snapToModel();
  }

  clearSketch() {
    if (!this.ctx || !this.canvasRef) return;
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.model.imageData = '';
  }

  private snapToModel() {
    if (!this.canvasRef) return;
    this.model.imageData = this.canvasRef.nativeElement.toDataURL('image/png');
  }

  private applyBrush() {
    if (!this.ctx) return;
    this.ctx.lineWidth = this.brushSize;
    this.ctx.strokeStyle = this.brushColor;
    this.ctx.globalCompositeOperation = this.isEraser ? 'destination-out' : 'source-over';
  }

  setColor(color: string) {
    this.brushColor = color;
    this.isEraser = false;
    this.applyBrush();
  }

  setSize(size: number) {
    this.brushSize = Math.max(1, Math.min(48, size || 1));
    this.applyBrush();
  }

  toggleEraser() {
    this.isEraser = !this.isEraser;
    this.applyBrush();
  }

  togglePalette(_ev: Event) {
    this.paletteOpen = !this.paletteOpen;
  }

  pickColour(colour: string) {
    this.setColor(colour);
    this.paletteOpen = false;
  }

  closePalette() { this.paletteOpen = false; }

  submit() {
    // Ensure latest sketch is saved
    this.snapToModel();
    this.submitted = true;
    if (!this.isValid()) {
      return; // show validation messages
    }
    // Persist researcher name for session defaults
    try { sessionStorage.setItem('ml_lastResearcherName', this.model.researcherName ?? ''); } catch {}
    if (this.isEdit && this.id) {
      this.svc.update(this.id, this.model).subscribe(() => {
        try { sessionStorage.setItem('ml_toast', 'Observation saved'); } catch {}
        this.router.navigateByUrl('/');
      });
    } else {
      this.svc.create(this.model).subscribe(() => {
        try { sessionStorage.setItem('ml_toast', 'Observation saved'); } catch {}
        this.router.navigateByUrl('/');
      });
    }
  }

  cancel() { this.router.navigateByUrl('/'); }

  isValid(): boolean {
    const cn = (this.model.commonName ?? '').trim();
    const rn = (this.model.researcherName ?? '').trim();
    return cn.length > 0 && rn.length > 0;
  }
}
