import { Component, OnInit } from '@angular/core';
import { Spinkit } from 'ng-http-loader'; // <============

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
  public spinkit = Spinkit;
  constructor() { }

  ngOnInit() {
  }

}
