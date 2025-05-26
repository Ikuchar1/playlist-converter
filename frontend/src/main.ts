import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  // Keep everything from your existing appConfig...
  ...appConfig,
  // …but override providers to include HttpClient
  providers: [
    importProvidersFrom(HttpClientModule),
    ...(appConfig.providers || []),  // re-use any router or other providers
  ],
})
.catch((err) => console.error(err));
