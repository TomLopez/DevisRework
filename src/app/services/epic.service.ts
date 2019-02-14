import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface setupInfos {
  epics: any[];
  projects: any[];
}

@Injectable({
  providedIn: 'root'
})
export class EpicService {
  
  lstProjects: any[];

  constructor(
    public http: HttpClient
  ) { }
  
  Angularget(configUrl) {
    console.log('this',this);
    return this.http.get(configUrl, {
      headers: {
        'X-TrackerToken': 'b4a752782f711a7c564221c2b0c2d5dc',
        'Content-Type': 'application/json'
      }
    });
  }

  fetchProjects(): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.Angularget('https://www.pivotaltracker.com/services/v5/projects').subscribe((res: Array<any>) => {
        let projects = [];
        projects = res.filter(o => o.description == 'reneco');
        projects.sort((a, b) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
          if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
          return 0;
        });      

        resolve(projects);
      });
    })
  }

  fetchEpics(): Promise<any> { /* va parcourir tout les projets et récuperer les epics et les foutre dans un tableaux */
    // this.log.setlogProcess('Getting all epics');
      return this.fetchProjects().then(projects => {
        return new Promise<any>((resolve, reject) => {
          let epics : any[];
          let epicsAdder = new Set();
          let epicsArray;
          let compter = projects.length;
          let promises: Promise<any>[] = [];
          for (let idProjet in projects) {
            let p = this.Angularget('https://www.pivotaltracker.com/services/v5/projects/' + projects[idProjet].id + '/epics')
              .toPromise()
              .then((data: any[]) => {
                let tabNames = data.map(o => epicsAdder.add(o.name.toLowerCase()));
                projects[idProjet].epicName = data.map(o => o.name.toLowerCase());
                epicsArray = Array.from(epicsAdder);
                epics = epicsArray.sort(function (a, b) {
                  if (a.toLowerCase() < b.toLowerCase()) return -1;
                  if (a.toLowerCase() > b.toLowerCase()) return 1;
                  return 0;
                });
              });
            promises.push(p);
          }
          Promise.all(promises).then((a) => {
            let result : setupInfos = {epics: epics, projects:projects};
            // result.epics = epics;
            // result.projects = projects;
            resolve(result);
          })
        });
      })
    }
}
