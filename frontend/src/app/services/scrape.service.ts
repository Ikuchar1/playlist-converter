import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Track { title: string; artist: string; }

@Injectable({ providedIn: 'root' })
export class ScrapeService {
  constructor(private http: HttpClient) {}

  scrape(url: string): Observable<Track[]> {
    return this.http.post<Track[]>('/api/scrape', { url });
  }
}
