import { Injectable } from '@angular/core';
// import { ServerobjectModule } from './serverobject.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http/';
// import { AlertDisplayerService } from '../alert-displayer.service';
// import { LogMessageComponent } from '../log-message/log-message.component';
import { HttpResponse } from '@angular/common/http/src/response';
import * as Modales from '../modales/modales.component';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { FormControl, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
// import { FormModalComponent } from '@angular/form-modal/form-modal.component';

// import { AlertDialogService } from 'src/services/alert-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class FormatterService {
  
  @ViewChild('ajoutRessources') ajoutRessources: NgbActiveModal;
  @ViewChild('templateRessourceModal') templateRessourceModal: NgbActiveModal;

  private listeTaches: any;
  private listeStories: any;
  private listeProjets: any;
  private blob: Blob;

  private modalRef: NgbModalRef;


  private FgTarificationData: FormControl[];

  /*Début de configuration pour l'api PivotalTracker*/
  public ConverterProjet = { "ID": "id", "Nom": "name", "Description": "description", "Stories": "listeStories" };
  public ConverterStories = { "Description": "name", "Labels": "labels", "OriginalId": "id", "Owners": "owner_ids", "StartDate": "created_at", "Type": "story_type", "URL": "url", "UpdatetDate": "updated_at", "isAMO": "AMO", "Fk_Project": "project_id", "Tasks": "listeTaches", "Bonus": "Bonus", "nonEffetue": "nonEffetue" };
  public ConverterTasks = { "description": "Description", "duree": "Duration", "initials": "Initials", "story_id": "FK_Stories", "isFerie": "ferie", "isWE": "weekend" };
  /*Fin de la configuration pivotal tracker*/

  public tarifications;
  private initialInexistante;
  private nbRessourceAAjouter;
  private currentRessource;
  private modalRessourceRef;
  private ressourceForm: FormGroup;



  // constructor(private http: HttpClient, private Serverobject: ServerobjectModule) {
  constructor(private http: HttpClient, private fb: FormBuilder, private activemodalService: NgbActiveModal, private modalService: NgbModal) {
    this.listeTaches = undefined;
    this.listeStories = undefined;
    this.listeProjets = undefined;
  }


  public transmuteTasks(TaskObject) {
    let finalListOfObjects = [];
    let tasksStructure;
    //Boucle sur object configConverterTasks
    for (let u in TaskObject) {
      let finalObjects = {};
      for (let i in this.ConverterTasks) {
        if (TaskObject[u][i] !== undefined) {
          finalObjects[this.ConverterTasks[i]] = TaskObject[u][i];
        }
      }
      finalListOfObjects.push(finalObjects);
    }
    this.listeTaches = finalListOfObjects;
    return finalListOfObjects;
  }

  public transmuteStories(StoryObject) { // Transformation des stories au format serveur
    let finalListOfObjects = [];
    //Boucle sur object config
    for (let u in StoryObject) { // parcours de toute les stories dans la liste de stories 
      let finalObjects = {}; // création de l'objet qui va contenir les info et qui sera sous le format serveur
      for (let i in this.ConverterStories) { // parcours du fichier de configuration
        if (StoryObject[u][this.ConverterStories[i]] !== undefined) { // si la story actuel contient le nom d'attribut actuel 
          finalObjects[i] = StoryObject[u][this.ConverterStories[i]];  // alors on ajoute au nouvel objet serveur un attribut "serveur" qui va contenir l'info de la story correspondante    			
        }
      }
      finalListOfObjects.push(finalObjects);	// on ajoute le nouvel objet à la
    }
    this.listeStories = finalListOfObjects;
    return finalListOfObjects;
  }

  public transmuteProjects(ProjectsObjects) {
    //obj bdd
    let finalListOfObjects = [];
    let projectStructure;
    //Boucle sur object config
    for (let u in ProjectsObjects) {
      let finalObjects = {};
      for (let i in this.ConverterProjet) {
        if (ProjectsObjects[u][this.ConverterProjet[i]] !== undefined) {
          finalObjects[i] = ProjectsObjects[u][this.ConverterProjet[i]];
        }
      }
      finalListOfObjects.push(finalObjects);
    }
    this.listeProjets = finalListOfObjects;
    return finalListOfObjects;
  }

  public encapsulateObjects(projects, stories, tasks, isFactu, tarCDP = null, tarDT = null,epicCommande) {
    let GeneralObject: any = {};
    // console.log('argument', arguments)
    if (projects != undefined && stories != undefined && tasks != undefined) {
      GeneralObject.projets = projects;
      for (let p in GeneralObject.projets) {
        GeneralObject.projets[p].Stories = stories.filter(o => o.Fk_Project == GeneralObject.projets[p].ID);
        for (let t in GeneralObject.projets[p].Stories) {
          // console.log('tasks before assign',tasks);
          GeneralObject.projets[p].Stories[t].Tasks = tasks.filter(o => o.FK_Stories == GeneralObject.projets[p].Stories[t].OriginalId);
        }
      }
      GeneralObject.JourDT = tarDT
      GeneralObject.jourCdp = tarCDP;
      GeneralObject.epic = epicCommande;
      // console.log('avant le send',GeneralObject);
      this.sendToServer(GeneralObject, isFactu);
    }
  }

  public getProjectFromEpic(allprojects, epic) : Promise<any> {

    return new Promise<any>((resolve, reject) => {
      let projectvalable = [];

      for (let idProjet in allprojects) {
        
        let myCurrentProject: any;

        if (allprojects[idProjet].epicName != undefined) {
          for (let Name in allprojects[idProjet].epicName) {
            if (allprojects[idProjet].epicName[Name].toLowerCase() === epic.toLowerCase()) {
              myCurrentProject = allprojects[idProjet];
              myCurrentProject.listeStories = [];
              projectvalable.push(myCurrentProject);
            }
          }
        }
      }
      
      resolve(projectvalable);
    })
  }
  
  public Angularget(configUrl, objetAEnvoyer) {
    // console.log('arguments',arguments);
    // let headers = {
    //   // 'X-TrackerToken': 'b4a752782f711a7c564221c2b0c2d5dc',
    //   'Content-Type': 'application/json'
    // }
    // console.log('objetaeznvoyer',objetAEnvoyer);
    let headers = new HttpHeaders();
    headers.append("DataType", "json")
    headers.append("Content-type", "application/json; charset=UTF-8");
    // let fd = new FormData();
    // fd.append('JourDT', objetAEnvoyer.JourDT);
    // fd.append('projets', JSON.stringify(objetAEnvoyer.projets));
    // fd.append('JourCDP', objetAEnvoyer.JourCDP);
    // debugger;
    return this.http.post(configUrl, objetAEnvoyer, {headers: {
      'DataType': 'json',
      'Content-type': 'application/json; charset=UTF-8'
    }});
    // return this.http.post(configUrl, objetAEnvoyer);
  }

  createForm() {
    this.ressourceForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      initial: '',
      niveau: ['', Validators.required],
      tarificationForm: new FormArray(this.FgTarificationData)
    });
  };

  setModalAjoutRessource() {
    let modalRef = this.modalService.open(this.ajoutRessources, { backdrop: "static" });
    this.modalRessourceRef = modalRef;
    this.FgTarificationData = this.tarifications.map(tarif => {
      return new FormControl(false);
    });
    this.createForm();
    return modalRef;
  }

  setModalRessourcesInexistante() {
    let modalRef = this.modalService.open(this.templateRessourceModal, { backdrop: "static" });
    return modalRef;
  }

  verifyInitial(taches): any {
    console.log('contentmodal',this.ajoutRessources);
    return new Promise((resolve, reject) => {
      let initialEmployes = [];
      this.http.get("http://localhost/DevisAPI/api/Ressource/").toPromise().then((res) => {
        for (let emp in res) {
          initialEmployes.push(res[emp].Initial)
        }
        let initialInexistante = [];

        for (let currentTasks in taches.Taches) {
          if (taches.Taches[currentTasks] && taches.Taches[currentTasks].initials && taches.Taches[currentTasks].initials.length > 2) {
            let owners = taches.Taches[currentTasks].initials.split("+");
            for (let currentOwner in owners) {
              if (!initialEmployes.includes(owners[currentOwner]) && owners[currentOwner] !== undefined) {
                initialInexistante.push(owners[currentOwner]);
              }
            }
          } else {
            if (!initialEmployes.includes(taches.Taches[currentTasks].initials) && taches.Taches[currentTasks].initials !== undefined) {
              initialInexistante.push(taches.Taches[currentTasks].initials);
            }
          }
        }
        let initialInexistanteArray = Array.from(initialInexistante);
        if (initialInexistanteArray.length > 0) {
          this.http.get('http://localhost/DevisAPI/api/tarification/').toPromise().then((res) => {
            this.tarifications = res;
            this.initialInexistante = initialInexistante;
            this.currentRessource = this.initialInexistante[0];
            this.nbRessourceAAjouter = this.initialInexistante.length;      
            resolve({tarifications: this.tarifications, missingRessources: this.initialInexistante})      
            // this.setModalRessourcesInexistante().result.then(() => {
            //   let n = this.modalRessourceRef as NgbActiveModal;
            //   n.close(() => {
            //     resolve(true);
            //   })
            //   n.dismiss(() => {
            //     reject(false);
            //   })
            // }).catch(() => {
            //   reject(false);
            // });
            // this.modalRef = this.modalService.open(this.ajoutRessources, { centered: true, windowClass: 'css-modal' })
            // this.modalRef.result.then((result) => {
            // });
          })
        } else {
          resolve(true);
        }
      });
    });
  }



  public getfile(configUrl) {
    return this.http.get(configUrl);
  }

  //Déplacer ca ou il faut
  public sendToServer(GeneralObject, isFactu) {
    // let httpparams = new HttpParams();
    // httpparams.append('projets', JSON.stringify(GeneralObject.projets));
    // httpparams.append('epic', JSON.stringify(GeneralObject.epic));
    // GeneralObject.projets = [];
    // let body = new FormData();
    // body.append('epic', GeneralObject.epic);
    // body.append('JourDT', GeneralObject.JourDT);
    // body.append('JourCDP', GeneralObject.JourCDP);
    // body.append('projets', JSON.stringify(GeneralObject.projets))
    console.log('before send',GeneralObject);
    if (isFactu) {
      console.log("sending object : ", GeneralObject);
      this.Angularget('http://localhost/DevisAPI/api/Facturation/', JSON.stringify(GeneralObject)).toPromise().then((file: HttpResponse<string>) => {
      let alertProcess = {
        title : "Terminé",
        content : "Processus Terminé :)"
      }
      // this.alerter.open(alertProcess);
        this.getfile("http://localhost/DevisAPI/api/Facturation/").toPromise().then((file: any) => {
          console.log("file", file);
        });
      }).catch((error) => {
        let alertProcess = {
          title : "Erreur serveur",
          content : "Il y à eu une erreur :("
        }
        // this.alerter.open(alertProcess);
      });
    } else {
      // console.log("sending object : ", GeneralObject);
      // this.Angularget('http://localhost/DevisAPI/api/Devis/', JSON.stringify(GeneralObject)).toPromise().then((res) => {
      this.Angularget('http://localhost/DevisAPI/api/Devis/',JSON.stringify(GeneralObject)).toPromise().then((res) => {
        let alertProcess = {
          title : "Terminé",
          content : "Processus Terminé :)"
        }
        // this.alerter.open(alertProcess);
        console.log("terminé ! ");
      }).catch((error) => {
        let alertProcess = {
          title : "Erreur serveur",
          content : "Il y à eu une erreur :("
        }
        // this.alerter.open(alertProcess);
        console.log("Il y a eu une erreur");
      });
    }
  }
}
