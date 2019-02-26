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
  totalStories: any[];
  concernedStoriesFactu: any[];
  concernedTasks: any[];

  valueDT: number = 8; 
  valueCDP: number = 12;

  private tarifications;

  private ressourceForm;
  private modalRessourceRef;
  private FgTarificationData: FormControl[];
  private missingRessources;
  private isFactu = false;

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
      return new Promise<any>((resolve, reject) => {
        let modalRef = this.modalService.open(this.ajoutRessources, { backdrop: "static"});
        this.modalRessourceRef = modalRef;
        this.FgTarificationData = this.tarifications.map(tarif => {
          return new FormControl(false);
        });
        this.createForm(initial);
        console.log('this.missingRessources.length ',this.missingRessources.length );
        return this.modalRessourceRef.result.then(() => {
          return resolve(true);
        });
      })
    }

    proceed(event){
      console.log('event click',this.valueCDP, this.valueDT);
      //Récupération des projets contenant l'épique choisi
      this.formatterservice.getProjectFromEpic(this.projects, this.selectedEpic).then(results =>{
        this.concernedProjects = results;
        console.log('azlùkefn', this.concernedProjects)
      }).then(()=>{
        //Récupération des stories pour les projets concernés
        this.storyservice.getProjectStories(this.concernedProjects, this.selectedEpic, true).then(result => {
          console.log('suite', result);
          //console.log('detaillé', result.map(o => o.project_id));
          this.concernedStories = result;
          // if(this.isFactu){
          //   this.storyservice.getAcceptedProjectStories(this.concernedProjects, 1 ,this.selectedEpic).then(result => {
          this.concernedStoriesFactu = result;
          //      console.log('concerned stories factu',this.concernedStoriesFactu);
          //   })
          // }
          // this.totalStories = this.concernedStories.concat(this.concernedStoriesFactu);
          this.totalStories = result;
          console.log('concerned stories', this.concernedStories);
          console.log('concerned stories accepted', this.concernedStoriesFactu);
          console.log('concerned stories total', this.totalStories);
          // debugger;
          //debugger;
        }).then(() => {
          //Récupération des taches des stories
          this.taskservice.getTasks(this.totalStories, this.concernedProjects, this.isFactu).then(result => {
            this.concernedTasks = result.Taches;
            console.log('tasks main',this.concernedTasks);
          }).then(() => {
            console.log('concerned tasks',this.concernedTasks);
            this.formatterservice.verifyInitial(this.concernedTasks).then((retour) => {
              console.log('les intiales', retour)
              if(retour.missingRessources){
                this.tarifications = retour.tarifications;
                this.missingRessources = _.uniq(retour.missingRessources);
                this.manageMissingRessources().then(() => {
                  this.transmuteObjects();
                  this.formatterservice.encapsulateObjects(this.concernedProjects, this.totalStories, this.concernedTasks, this.isFactu,this.valueCDP,this.valueDT,this.selectedEpic);
                });
              }else{
                console.log('before transmute ', JSON.parse(JSON.stringify(this.concernedTasks)))
                this.transmuteObjects();
                console.log('after  transmute ', this.concernedTasks)

                this.formatterservice.encapsulateObjects(this.concernedProjects, this.totalStories, this.concernedTasks, this.isFactu,this.valueCDP,this.valueDT,this.selectedEpic);

              }             
            }).catch((retour) => {
              //location.reload(true);
              console.log('error',retour);
            })
          });
        });
      });
    }

    onSelectionChange(event){
      console.log('entry',event);
      let factucontainer = document.querySelector('#factuInfosContainer');
      if(event.target.id == 'devis'){
        if(!factucontainer.classList.contains('hidden')){
          factucontainer.classList.add('hidden');
        }
        this.isFactu = false;
      }else{
        this.isFactu = true;
        if(factucontainer.classList.contains('hidden')){
          factucontainer.classList.remove('hidden');
        }
      }
    }

    transmuteObjects(){
      this.concernedProjects = this.formatterservice.transmuteProjects(this.concernedProjects);
      this.concernedStories = this.formatterservice.transmuteStories(this.concernedStories);
      this.concernedStoriesFactu = this.formatterservice.transmuteStories(this.concernedStoriesFactu);
      this.totalStories = this.formatterservice.transmuteStories(this.totalStories);
      this.concernedTasks = this.formatterservice.transmuteTasks(this.concernedTasks);
    }

    manageMissingRessources(){
      return new Promise<any>((resolve, reject) => {
        if(this.missingRessources.length){
          this.setModalAjoutRessource(this.missingRessources[0]).then(() => {
            if(this.missingRessources.length){
              return this.manageMissingRessources().then(() => {resolve(true)});    
            }else{
              resolve(true)
            }
          })
        }else{
          resolve(true);
        }
      })
    }

    validerRessource() {
      return new Promise((resolve, reject) => {      
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
            
            //this.manageMissingRessources();
            //this.setcurrentRess();
            resolve(true);
          }).catch(() => {
            reject(true);
            // this.alertSrv.open({ title: "Une erreur est survenue", content: 'Le serveur à rencontré une erreur innatendue, le processus va redémarrer' }).result.then(() => {
            //   location.reload(true);
            // }).catch(() => {
            //   location.reload(true);
            // })
          })
        }
      });
    }

    showUsersModal(){
      this.modalRef = this.modalService.open(this.ajoutRessources, { centered: true, windowClass: 'css-modal' })
      this.modalRef.result.then((result) => {
      });
    }

    setMonthPicker(){
      let monthValue = this.selectedEpic.split('-');
      let regexMonth = /[A-Z|a-z]{3,10}/;
      let regexYears = /([0-9]{4})/;
      let month = regexMonth.exec(monthValue[1]);
      let year = regexYears.exec(monthValue[1]);
      console.log('monthValue', monthValue);
      let enumMonth = {
        janvier: '01',
        février: '02',
        fevrier: '02',
        mars: '03',
        avril: '04',
        mai: '05',
        juin: '06',
        juillet: '07',
        août: '08',
        aout: '08',
        septembre: '09',
        octobre: '10',
        novembre: '11',
        décembre: '12',
        decembre: '12'
      }           
      let monthPicker = document.createElement('input');
      monthPicker.type = "month";
      monthPicker.id = "month";
      monthPicker.pattern = '[0-9]{4}/[0-9]{2}';
      monthPicker.style.borderRadius = "15px";
      monthPicker.style.padding = "10px";
      monthPicker.placeholder = year[0].toString() + '-' + enumMonth[month.toString()]; ;
      monthPicker.style.position = "absolute";
      monthPicker.style.bottom = "40px";
      monthPicker.style.left = "50%";
      monthPicker.style.transform = "translateX(-50%)";
      monthPicker.style.width = "25%";
      let monthSelectorContainer = document.getElementById('monthSelectorContainer');
      monthSelectorContainer.appendChild(monthPicker);
    }

}
