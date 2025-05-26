import { Component } from '@angular/core';
import { ScrapeService, Track } from './services/scrape.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  playlistUrl = '';
  tracks: Track[] = [];
  loading = false;
  error = '';

  constructor(private scrapeService: ScrapeService) {}

  onSubmit() {
    this.error = '';
    this.tracks = [];
    this.loading = true;

    this.scrapeService.scrape(this.playlistUrl).subscribe({
      next: (data) => {
        this.tracks = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to scrape playlist';
        console.error(err);
        this.loading = false;
      }
    });
  }
}
