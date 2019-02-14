import { Component, OnInit, ViewChild } from '@angular/core';
import { EpicService } from './services/epic.service';
import { FormatterService } from './services/formatter.service';
import { StoryService } from './services/story.service';
import { TaskService } from './services/task.service';
import { HttpClient} from '@angular/common/http';

import * as _ from 'lodash'

import { NgbModal, NgbModalRef,NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  
  /*Usefull informations*/
  title = 'Devis - Facturation';
  epics : Array<any> = [];
  projects : Array<any> = [];
  
  /*Process data*/
  selectedEpic : string = null;
  concernedProjects : any[];
  concernedStories: any[];
  concernedTasks: any[];

  private tarifications;

  private ressourceForm;
  private modalRessourceRef;
  private FgTarificationData: FormControl[];
  private missingRessources

  @ViewChild('ajoutRessources') ajoutRessources: NgbActiveModal;

  private modalRef: NgbModalRef;

  constructor( private epicservice: EpicService, 
    private formatterservice: FormatterService, 
    private storyservice: StoryService,
    private taskservice: TaskService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private http: HttpClient
    )
    {}
  
    ngOnInit(){
      //Recupération liste des epics pour tous les projets reneco
      this.epicservice.fetchEpics().then(
        results => {
          this.epics = results.epics;
          this.projects = results.projects;
          console.log('infos début projects',this.projects, 'epics',this.epics);
      });    
    }    

    epicSelected(event){
    
    }


    createForm(initial) {
      this.ressourceForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', Validators.required],
        initial: initial,
        niveau: ['', Validators.required],
        tarificationForm: new FormArray(this.FgTarificationData)
      });
    }

    setModalAjoutRessource(initial) {
      let modalRef = this.modalService.open(this.ajoutRessources, { backdrop: "static"});
      this.modalRessourceRef = modalRef;
      this.FgTarificationData = this.tarifications.map(tarif => {
        return new FormControl(false);
      });
      this.createForm(initial);
      console.log('zopjnvrozejezrvnk', this.ressourceForm)
      return modalRef;
    }

    proceed(event){
      console.log('event click',event);
      
      //Récupération des projets contenant l'épique choisi
      this.formatterservice.getProjectFromEpic(this.projects, this.selectedEpic).then(results =>{
        this.concernedProjects = results;
        console.log('azlùkefn', this.concernedProjects)
      }).then(()=>{
        //Récupération des stories pour les projets concernés
        this.storyservice.getProjectStories(this.concernedProjects, this.selectedEpic).then(result => {
          console.log('suite', result);
          console.log('detaillé', result.map(o => o.project_id));
          this.concernedStories = result;
        }).then(() => {
          //Récupération des taches des stories
          this.taskservice.getTasks(this.concernedStories, this.concernedProjects, false).then(result => {
            console.log('tasks main',result);
            this.concernedTasks = result;
          }).then(() => {
            console.log('concerned tasks',this.concernedTasks);
            this.formatterservice.verifyInitial(this.concernedTasks).then((retour) => {
              console.log('les intiales', retour)
              if(retour.missingRessources){
                this.tarifications = retour.tarifications;
                this.missingRessources = _.uniq(retour.missingRessources);
                this.manageMissingRessources()
                // this.setModalAjoutRessou_.uniq(rce(_.uniq(retour.missingRessources),retour.missingRessources[0] )
                //.close((result) => {console.log('resultmodalclose',result);});
              }
              // if (retour) {
              //   this.myTransMuter.encapsulateObjects(transformedProject, transformedStories, transformedTasks, false, 0, 0, this.epicCommande)
              //   console.log('envoir en cours');
              //   this.setSpinner();
              // }
            }).catch((retour) => {
              //location.reload(true);
              console.log('error',retour);
            })
          });
        });
      });
    }
    manageMissingRessources(){
      if(this.missingRessources.length)
        this.setModalAjoutRessource(this.missingRessources[0])
    }

    validerRessource() {
      let data: any = this.ressourceForm.getRawValue();
      let usersTarifications: boolean[] = data.tarificationForm;
      let selectedTarifications: Int16Array[] = [];
      usersTarifications.forEach((isSelected, index) => {
        if (isSelected)
          selectedTarifications.push(this.tarifications[index].ID);
      });
  
      if (data.name == '' || data.name == undefined
        || data.initial == ''
        || data.initial == undefined
        || data.email == ''
        || data.email == undefined
        || data.niveau == ''
        || data.niveau == undefined
        || selectedTarifications == undefined) {
        // this.alertSrv.open({ title: "Echec", content: "Tout les champs doivent êtres remplies" }).result.then(() => {
        //   return;
        // }).catch(() => {
        //   return;
        // })
      } else {
        let nouvelle_ressource: any = {};
        nouvelle_ressource.name = data.name;
        nouvelle_ressource.initial = data.initial;
        nouvelle_ressource.mail = data.email;
        nouvelle_ressource.niveau = data.niveau;
        nouvelle_ressource.tarification = selectedTarifications;
        console.log(nouvelle_ressource);
        this.ressourceForm.reset();
        this.http.post("http://localhost/DevisAPI/api/ressource", nouvelle_ressource).toPromise().then(() => {
          alert("c'est bon c'est envoyer");
          this.modalRessourceRef.close();
          this.missingRessources.shift();
          this.manageMissingRessources();
          //this.setcurrentRess();
        }).catch(() => {
          // this.alertSrv.open({ title: "Une erreur est survenue", content: 'Le serveur à rencontré une erreur innatendue, le processus va redémarrer' }).result.then(() => {
          //   location.reload(true);
          // }).catch(() => {
          //   location.reload(true);
          // })
        })
      }
    }

    showUsersModal(){
      this.modalRef = this.modalService.open(this.ajoutRessources, { centered: true, windowClass: 'css-modal' })
      this.modalRef.result.then((result) => {
      });
    }

}
