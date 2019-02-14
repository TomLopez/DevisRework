import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef,NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modales',
  templateUrl: './modales.component.html',
  styleUrls: ['./modales.component.scss']
})
export class ModalesComponent implements OnInit {

  @ViewChild('ajoutRessources') ajoutRessources: NgbActiveModal;

  private modalRef: NgbModalRef;

  constructor(private modalService: NgbModal) { }

  ngOnInit() {
  }

  public showModal(){
    this.modalRef = this.modalService.open(this.ajoutRessources, { centered: true, windowClass: 'css-modal' })
    this.modalRef.result.then((result) => {
    });
  }

}
