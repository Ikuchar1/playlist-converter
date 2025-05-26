import { Component } from '@angular/core';
import * as Papa from 'papaparse';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  tracks: { title: string; artist: string }[] = [];
  error = '';
  dragging = false;

  // Prevent browser default and mark dragging state
  onDragOver(evt: DragEvent) {
    evt.preventDefault();
    this.dragging = true;
  }
  onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    this.dragging = false;
  }

  // Handle both drop and file-picker events
  onFile(event: Event | DragEvent) {
    event.preventDefault();
    this.dragging = false;
    this.error = '';
    this.tracks = [];

    let file: File | null = null;
    if (event instanceof DragEvent) {
      file = event.dataTransfer?.files.item(0) || null;
    } else {
      const inp = event.target as HTMLInputElement;
      file = inp.files?.item(0) || null;
    }
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: Papa.ParseResult<any>) => {
        this.tracks = res.data
          .map(r => ({
            title: r.title?.trim() || '',
            artist: r.artist?.trim() || '',
          }))
          .filter(t => t.title && t.artist);
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'Failed to parse CSV file.';
      },
    });
  }
}
