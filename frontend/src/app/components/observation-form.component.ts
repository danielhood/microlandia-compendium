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
        <button type="button" (click)="cancel()">Cancel</button>
        <button type="submit">Save</button>
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
              <button type="button" class="colour-swatch" (click)="togglePalette($event)" [class.eraser]="isEraser" [style.background]="isEraser ? 'transparent' : brushColor" aria-label="Choose colour">
                <svg *ngIf="isEraser" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </button>
              <div class="colour-grid" *ngIf="paletteOpen">
                <button type="button" class="swatch-btn" *ngFor="let c of palette"
                        [style.background]="c" (click)="pickColour(c)"></button>
                <div class="palette-actions">
                  <button type="button" (click)="pickEraser()" [class.active]="isEraser">Erase</button>
                </div>
              </div>
            </div>
            <label class="ctl size">
              <span>Size</span>
              <input #sizeCtl type="range" min="1" max="24" [value]="brushSize" (input)="setSize(sizeCtl.valueAsNumber || +sizeCtl.value)" />
            </label>
            <input #cameraInput type="file" accept="image/*" capture="environment" (change)="onCapture(cameraInput.files)" style="display:none" />
            <button type="button" class="icon-btn" (click)="cameraInput.click()" aria-label="Camera">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M9.5 4l1.5 2h4l1.5-2H20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.5zm2.5 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
              </svg>
            </button>
            <button type="button" class="clear-btn" (click)="clearSketch()">Clear</button>
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
      const { nativeElement: canvas } = this.canvasRef;
      // Ensure captured image renders regardless of current brush/composite (e.g., eraser)
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      this.ctx.restore();
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

  pickEraser() {
    this.isEraser = !this.isEraser;
    this.applyBrush();
    this.paletteOpen = false;
  }

  togglePalette(_ev: Event) {
    this.paletteOpen = !this.paletteOpen;
  }

  pickColour(colour: string) {
    this.setColor(colour);
    this.paletteOpen = false;
  }

  closePalette() { this.paletteOpen = false; }

  onCapture(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      // Draw captured image onto canvas and store
      this.drawImageData(dataUrl);
      // Snapshot after next tick to ensure draw completed
      setTimeout(() => this.snapToModel(), 0);
    };
    reader.readAsDataURL(file);
  }

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
