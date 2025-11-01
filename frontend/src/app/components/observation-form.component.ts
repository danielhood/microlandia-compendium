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
      <div class="sketch">
        <div class="sketch-header">
          <strong>Sketch</strong>
          <div class="sketch-actions">
            <button type="button" (click)="clearSketch()">Clear Sketch</button>
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
      <div class="actions">
        <button type="submit">Save</button>
        <button type="button" (click)="cancel()">Cancel</button>
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
  private strokeStyle = '#ffffff';
  private lineWidth = 3;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.id;
    if (this.isEdit && this.id) {
      this.svc.get(this.id).subscribe(data => {
        this.model = {
          researcherName: data.researcherName,
          commonName: data.commonName,
          scientificName: data.scientificName,
          habitat: data.habitat,
          fieldNotes: data.fieldNotes ?? '',
          imageData: data.imageData ?? ''
        };
        // Ensure canvas reflects existing image when editing
        setTimeout(() => this.initCanvas(), 0);
      });
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
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.lineWidth = this.lineWidth;
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

  submit() {
    // Ensure latest sketch is saved
    this.snapToModel();
    if (this.isEdit && this.id) {
      this.svc.update(this.id, this.model).subscribe(() => this.router.navigateByUrl('/'));
    } else {
      this.svc.create(this.model).subscribe(() => this.router.navigateByUrl('/'));
    }
  }

  cancel() { this.router.navigateByUrl('/'); }
}
