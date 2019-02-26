import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { ClassGetter } from '@angular/compiler/src/output/output_ast';


@Injectable({
  providedIn: 'root'
})
export class StoryService {

  constructor(
    public http: HttpClient
  ) { }
  
  Angularget(configUrl) {
    return this.http.get(configUrl, {
      headers: {
        'X-TrackerToken': 'b4a752782f711a7c564221c2b0c2d5dc',
        'Content-Type': 'application/json'
      }
    });
  }

  private monthConversion = {
    "janvier":"01",
    "février":"02",
    "mars":"03",
    "avril":"04",
    "mai":"05",
    "juin":"06",
    "juillet":"07",
    "aout":"08",
    "septembre":"09",
    "octobre":"10",
    "novembre":"11",
    "décembre":"12"  
  }


  public getProjectStories(projects, epic, isFactu = false, date = null) : Promise<any> {
    //this.log.setlogProcess("Getting stories from project");
    return new Promise<any>((resolve, reject) => {
      let stories = [];
      let storiesAccepted = [];
      let storiesSansEpics = [];
      let promises: Promise<any>[] = [];
      for (let i in projects) {
        console.log('dans le projet', projects[i]);

        let res = this.Angularget("https://www.pivotaltracker.com/services/v5/projects/" + projects[i].id + "/stories" + "?with_label=" + epic)
          .toPromise().then((res: any) => {
            let myCurrentStory: any;
            for (let u in res) {
              myCurrentStory = res[u];
              myCurrentStory.listeTaches = [];
              if (myCurrentStory.story_type.toLowerCase() != 'release' && !this.checkifBonus(myCurrentStory.labels)) {
                res[u].listeTaches = new Array();
                myCurrentStory.story_type = "";
                let stringLabels = "";
                myCurrentStory.nonEffetue = false;
                myCurrentStory.Bonus = false;
                for (let o in myCurrentStory.labels) {
                  if (myCurrentStory.labels[o].name == "des" || myCurrentStory.labels[o].name == "dev" || myCurrentStory.labels[o].name == "amo") {
                    myCurrentStory.story_type = myCurrentStory.labels[o].name;
                  }
                  stringLabels += myCurrentStory.labels[o].name + " ";
                  if (myCurrentStory.labels[o].name == "amo") {
                    myCurrentStory.AMO = true;
                  }
                }
                myCurrentStory.labels = stringLabels;
                myCurrentStory.owner_ids = myCurrentStory.owner_ids.toString();
                if (myCurrentStory.AMO == undefined) {
                  myCurrentStory.AMO = false;
                }
                // if (myCurrentStory.current_state != "accepted") {
                //   myCurrentStory.nonEffetue = true;
                // }
                if (!(projects[i].listeStories == undefined) && !(myCurrentStory == undefined)) {
                  stories.push(myCurrentStory);
                  if (myCurrentStory.project_id == projects[i].id) {
                    projects[i].listeStories.push(myCurrentStory);
                  }
                }
              }
            }          
          });
        promises.push(res);
        if(isFactu){
          let correctedDate = moment(date).startOf('month').format('YYYY-MM-DD[T]HH:mm:ss.SSS');
          let nowDate = moment();
          let factuInfoDate = epic.split('-')[1].trim().split(' ');
          let strDateStart = ''
          let dateStart;
          let dateEnd;
          if(factuInfoDate){
            strDateStart = factuInfoDate[2] + "-" + this.monthConversion[factuInfoDate[1].toLowerCase()] + "-01";
            dateStart = moment(strDateStart).toISOString();
            dateEnd = moment(strDateStart).endOf('month').toISOString();
          }else{
            alert('l\'epic ne permet pas de déterminer un mois de facturation');
            //TODO gerer le cas et faire pop un picker de date
            return;
          }
          //let dateNow = moment().toISOString()
          // let tempnow = '2019-01-31T23:35:09.259Z'
          // let tempdep = '2019-01-01T00:00:00.001Z'
          let res2 = this.Angularget("https://www.pivotaltracker.com/services/v5/projects/" + projects[i].id + "/stories?accepted_after=" + dateStart + "&accepted_before=" + dateEnd)
            .toPromise().then((res: any) => {
              for (let u in res) {
                let stringLabels: string = "  ";
                let myCurrentStory: any;
                myCurrentStory = res[u];
                if (myCurrentStory.story_type.toLowerCase() != 'release') {
                  myCurrentStory.listeTaches = new Array();
                  myCurrentStory.story_type = "";
                  if (this.containsEpic(myCurrentStory.labels, epic)) {
                    storiesAccepted.push(myCurrentStory);
                  } else {
                    storiesSansEpics.push(myCurrentStory);
                  }

                  for (let o in myCurrentStory.labels) {
                    if (myCurrentStory.labels[o] != undefined) {
                      if (myCurrentStory.labels[o].name.trim().toLowerCase() == 'bonus') {
                        myCurrentStory.Bonus = true;
                      }
                      stringLabels += myCurrentStory.labels[o].name + " ; ";
                      if (myCurrentStory.labels[o].name == "des" || myCurrentStory.labels[o].name == "dev" || myCurrentStory.labels[o].name == "amo") {
                        myCurrentStory.story_type = myCurrentStory.labels[o].name;
                        if (myCurrentStory.labels[o].name == "amo") {
                          myCurrentStory.AMO = true;
                        }
                      }
                      myCurrentStory.listeTaches = [];
                      myCurrentStory.owner_ids = myCurrentStory.owner_ids.toString();
                      if (myCurrentStory.AMO == undefined) {
                        myCurrentStory.AMO = false;
                      }
                      else if (myCurrentStory.Bonus == undefined || myCurrentStory.Bonus == null) {
                        myCurrentStory.Bonus = false;
                      }
                    }
                  }
                  myCurrentStory.labels = stringLabels;
                  stringLabels = " ";
                }                
              }
            });
          promises.push(res2);
        }
      }
      Promise.all(promises).then(() => {

        this.distinctStories(stories, storiesAccepted).then((result) => {
          resolve(this.formatStories(result))
        });      
        // resolve({stories: this.formatStories(stories), acceptedStories: this.formatStories(storiesAccepted)})
      })
    });
  }

  containsEpic(labels, epic): boolean {
    for (let lab in labels) {
      if (labels[lab] != undefined && labels[lab].name != undefined) {
        if (labels[lab].name.toLowerCase() == epic.toLowerCase()) {
          return true;
        }
      }
    }
    return false;
  }

  formatStories(storiesTab){
    console.log('lalength',storiesTab);
    let ProperStories = [];
    for (let z in storiesTab) {
      if (storiesTab[z].labels != undefined) {
        if (storiesTab[z].labels.includes('bonus')) {
          storiesTab[z].nonEffetue = false;
          //ProperStories.push(storiesTab[z]);
        } else {
          storiesTab[z].nonEffetue = false;
          //ProperStories.push(storiesTab[z]);
        }
      }
      if (storiesTab[z].current_state != "accepted") {
        // console.log("e[cpt]", e[cpt]);
        storiesTab[z].nonEffetue = true;
      }
      ProperStories.push(storiesTab[z]);
    }
    console.log('ProperStories',ProperStories);
    return ProperStories;
  }

  getAcceptedProjectStories(projects, date, epic): any {
    return new Promise<any>((resolve, reject) => {
      let stories = [];
      let storiesSansEpics = [];
      let correctedDate = moment(date).startOf('month').format('YYYY-MM-DD[T]HH:mm:ss.SSS');
      let promises: Promise<any>[] = [];
      for (let i in projects) {
        console.log('dans le projet', projects[i]);
        //Example en dur a dynamiser avec du front
        let nowDate = moment();
        let res = this.Angularget("https://www.pivotaltracker.com/services/v5/projects/" + projects[i].id + "/stories?accepted_after=" + correctedDate + "&accepted_before=" + nowDate.toISOString())
          .toPromise().then((res: any) => {
            for (let u in res) {
              let stringLabels: string = "  ";
              let myCurrentStory: any;
              myCurrentStory = res[u];
              if (myCurrentStory.story_type.toLowerCase() != 'release') {
                myCurrentStory.listeTaches = new Array();
                myCurrentStory.story_type = "";
                if (this.containsEpic(myCurrentStory.labels, epic)) {
                  stories.push(myCurrentStory);
                } else {
                  storiesSansEpics.push(myCurrentStory);
                }

                for (let o in myCurrentStory.labels) {
                  if (myCurrentStory.labels[o] != undefined) {
                    if (myCurrentStory.labels[o].name.trim().toLowerCase() == 'bonus') {
                      myCurrentStory.Bonus = true;
                    }
                    stringLabels += myCurrentStory.labels[o].name + " ; ";
                    if (myCurrentStory.labels[o].name == "des" || myCurrentStory.labels[o].name == "dev" || myCurrentStory.labels[o].name == "amo") {
                      myCurrentStory.story_type = myCurrentStory.labels[o].name;
                      if (myCurrentStory.labels[o].name == "amo") {
                        myCurrentStory.AMO = true;
                      }
                    }
                    myCurrentStory.listeTaches = [];
                    myCurrentStory.owner_ids = myCurrentStory.owner_ids.toString();
                    if (myCurrentStory.AMO == undefined) {
                      myCurrentStory.AMO = false;
                    }
                    else if (myCurrentStory.Bonus == undefined || myCurrentStory.Bonus == null) {
                      myCurrentStory.Bonus = false;
                    }
                  }
                }
                myCurrentStory.labels = stringLabels;
                stringLabels = " ";
              }

            }
          });
        promises.push(res);
      }
      Promise.all(promises).then(() => {
        if (storiesSansEpics.length > 0) {
          let objectToSend: any = {};
          objectToSend.stories = stories;
          objectToSend.storiesSansEpics = storiesSansEpics;
          reject(objectToSend);
         // this.log.setLoadingProperty();
        } else {
          let objectToSend: any = {};
          objectToSend.stories = stories;
          resolve(objectToSend);
         // this.log.setLoadingProperty();
        }
      })

    });
  }

  private distinctStories(first, second){
    console.log('les deux tabs', first, second)
    return new Promise<any>((resolve, reject) => {
      let ids: any[] = first.map(o => o.id);
      for (let i in second){
        console.log('second[i].id',second[i].id, ids.indexOf(second[i].id));
        if(ids.indexOf(second[i].id) == -1){
          first.push(second[i]);
        }else{
          console.log('dans le if ',first.find(o => o.id == ids[ids.indexOf(second[i].id)]).project_id, second[i].project_id );
          if(first.find(o => o.id == ids[ids.indexOf(second[i].id)]).project_id != second[i].project_id){
            console.log('elseif de la bombe',second[i]);
            first.push(second[i]);
          }
        }
      }
      console.log('result²',first);
      resolve(first);
    });
  }

  private checkifBonus(labels) {
    for (let i in labels) {
      if (labels[i].name == "bonus") {
        return true;
      }
    }
    return false;
  }
}
