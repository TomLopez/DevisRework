import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataparserService {

  constructor() { }

  getProjectFromEpic(allprojects, epic) : Promise<any> {

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
}
