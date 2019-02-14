import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { UiModule } from './ui/ui.module';
import {NgbModule, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';


import { HttpClientModule } from '@angular/common/http';
import { ModalesComponent } from './modales/modales.component'; 

@NgModule({
  declarations: [
    AppComponent,
    ModalesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    UiModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule.forRoot(),
  ],
  providers: [NgbActiveModal],
  bootstrap: [AppComponent]
})
export class AppModule { }
