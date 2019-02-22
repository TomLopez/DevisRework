import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

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

  getTasks(stories, projects, isFactu) {
    // this.log.setlogProcess('Getting Tasks from stories');
     return new Promise<any>((resolve, reject) => {
       let tasks = [];
       let listeModifie = [];
       let promises: Promise<any>[] = [];
       for (let i in projects) {
         if (stories != undefined) {
					 let strfiltered = stories.filter(o => o.project_id == projects[i].id && o.story_type != 'release');
           for (let s in strfiltered) {
             let result = this.Angularget("https://www.pivotaltracker.com/services/v5/projects/" + strfiltered[s].project_id + "/stories/" + strfiltered[s].id + "/tasks")
               .toPromise().then((result) => {
                 for (let u in result) {
                   if (result[u].story_id == strfiltered[s].id) {
                     tasks.push(result[u]);
                     strfiltered[s].listeTaches.push(result[u]);
                   }
                 }
                 let projetid = projects.map(o => o.id);
                 let storiesid = [];
                 for (let k in projects) {
                   storiesid.push(projects[k].id);
                 }
                 if (strfiltered[s].id != undefined && tasks != undefined && strfiltered[s].project_id != undefined) {
                  //  if (isFactu == true) {

                  //    listeModifie = this.getInfoFromTasks(tasks, strfiltered[s].id, strfiltered[s].project_id, true);
                  //  } else {
                  //    listeModifie = this.getInfoFromTasks(tasks, strfiltered[s].id, strfiltered[s].project_id, false);
									//  }
									listeModifie = this.getInfoFromTasks(tasks, strfiltered[s].id, strfiltered[s].project_id, isFactu);
									
                 }
               });
             promises.push(result);
           }
         }
       }
       Promise.all(promises).then(() => {
         let objectToSend: any = {};
         objectToSend.Taches = listeModifie;
    //     this.log.setlogProcess("Tasks have been parsed");
         resolve(objectToSend);
       })
     });
   }

   getInfoFromTasks(tasks, storyId, projectId, isFactu): any {
		var tasksModified = []; 							//initialisation tableaux vide
		var cpt = 0;
		for (let i in tasks) {
			var tabDescrInfo = tasks[i].description.split('.-');
			if (tabDescrInfo.length <= 1) {
				tabDescrInfo = tasks[i].description.split('. -');
				if (tabDescrInfo.length <= 1) {
	//				this.log.setlogMessage("cette tâche n'est pas correctement formaté '" + tasks[i].description + '  ' +tasks[i].story_id + "'");
				}
			} else {

				var isWE = false;
				var isFerie = false;
				var realizedState = null;
				if (isFactu) {
					var regexWE = /(\@[wW])$/;
					if (tabDescrInfo[1].trim().match(regexWE)) {
						isWE = true;
						realizedState = 'we';
						tabDescrInfo[1] = tabDescrInfo[1].trim().replace(regexWE, "");
					} else {
						var regexF = /(\@[fF])$/;
						if (tabDescrInfo[1].trim().match(regexF)) {
							isFerie = true;
							realizedState = 'f';
							tabDescrInfo[1] = tabDescrInfo[1].trim().replace(regexF, "");
						}
					}
				}
				if (tabDescrInfo.length > 1) {
					var regex = /\+/; //cherche "+" dans le text , Si n programming
					if (tabDescrInfo[1].trim().match(regex)) {
						regex = /[A-Z]{2,}(\+[A-Z]{2,})+$/
						if (tabDescrInfo[1].trim().match(regex)) {
							var ownerBrut = regex.exec(tabDescrInfo[1].trim());
							var owners = ownerBrut[0].split("+");
							tabDescrInfo[1] = tabDescrInfo[1].trim().replace(regex, "");
							regex = /\(?\d+(\+\d+)+\)?/; //Cherche les durees dans le text
							if (tabDescrInfo[1].trim().match(regex)) {
								var duree: any = 0;
								var tabDureeBrut;
								tabDureeBrut = regex.exec(tabDescrInfo[1].trim());
								tabDescrInfo[1] = tabDescrInfo[1].trim().replace(regex, "");
								var tabDuree = tabDureeBrut[0].split('+');
								if (tabDuree.length != owners.length) {
									// this.log.setlogMessage('Probleme d\'estimation et initiales dans la tâche : ' + tasks[i].id + ' de la storie n° : ' + tasks[i].story_id + ' n\'est pas estimée.\r\n https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id)
									// this.setError('https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id, tasks[i].id);
								} else {
									tasks[i].initials = "";
									tasks[i].duree = "";
									tasks[i].isWE = isWE;
									tasks[i].isFerie = isFerie;
									let somme = "";
									for (let l in tabDuree) {
										somme += tabDuree[l] + '+';
									}
									var regexParenth = /(\(|\))/gmi;
									somme = somme.replace(regexParenth, "");
									tasks[i].duree = somme.substr(0, somme.length - 1);
									for (let ow in owners) {
										tasks[i].initials += owners[ow] + '+';
									}
									tasks[i].initials = tasks[i].initials.substr(0, tasks[i].initials.length - 1);
									if (realizedState == undefined || realizedState == null) {
										tasks[i].isBonnus = false;
									} else {
										tasks[i].isBonnus = realizedState;
									}
									tasksModified.push(tasks[i]);
									cpt++;
								}
							} else {
								tasks[i].duree = null;
								// this.log.setlogMessage('Probleme d\'estimation dans la tâche : ' + tasks[i].id + ' de la storie n° : ' + tasks[i].story_id + ' n\'est attribué et/ou n\'est pas estimée.\r\n https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id)
							}
						} else {
							// this.log.setlogMessage('Probleme d\'initales dans la tâche : ' + tasks[i].id + ' de la storie n° : ' + tasks[i].story_id + ' n\'est attribué.\r\n https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id)
							// this.setError('https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id, tasks[i].id);
						}
					}


					//Tache solo
					else {
						//CHerche l'owner de la tache
						regex = /[A-Z]{2,}/;
						var owner_initial;
						if (tabDescrInfo[1].trim().match(regex)) {							
							var taskMemeber = regex.exec(tabDescrInfo[1].trim())[0];
							owner_initial = taskMemeber;
							tabDescrInfo[1] = tabDescrInfo[1].trim().replace(regex, "");
							//La duree
							regex = /\(?(\d)+\)?/;
							// console.log('DESCRIPTION    ///////////////', tabDescrInfo[1].trim());
							if (regex.exec(tabDescrInfo[1].trim())) {
								var regexParenth = /\)$/
								var duree: any = 0;
								duree = regex.exec(tabDescrInfo[1].trim())[0];
								tabDescrInfo[1] = tabDescrInfo[1].trim().replace(regex, "");
								tasks[i].initials = owner_initial;
								var regexParenth = /(\(|\))/gmi;
								tasks[i].isWE = isWE;
								tasks[i].isFerie = isFerie;
								tasks[i].duree = duree.replace(regexParenth, "");;
								if (realizedState == undefined || realizedState == null) {
									tasks[i].isBonnus = false;
								} else {
									tasks[i].isBonnus = realizedState;
								}
								tasksModified.push(tasks[i]);
								cpt++;
							}
							else {
								console.log('$$$$$$$$$$$$  NE MARCHE PAS','Pas de duréee', tasks[i].description);
								// this.log.setlogMessage('Probleme d\'estimation dans la tâche : ' + tasks[i].id + ' de la storie n° : ' + tasks[i].story_id + ' n\'est pas estimée.\r\n https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id)
								// this.setError('https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id, tasks[i].id);
							}
						} else {
							console.log('$$$$$$$$$$$$  NE MARCHE PAS','Pas d\'initiales', tasks[i].description);

							// this.log.setlogMessage('Probleme d\'initales dans la tâche : ' + tasks[i].id + ' de la storie n° : ' + tasks[i].story_id + ' n\'est attribué.\r\n https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id)
							// this.setError('https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id, tasks[i].id);
						}
					}
				} else {
					console.log('$$$$$$$$$$$$  NE MARCHE PAS','Probleme diverse', tasks[i].description);
					// this.log.setlogMessage('La tâche : ' + tasks[i].id + ' de la storie n° : ' + tasks[i].story_id + ' n\'est pas attribué et/ou n\'est pas estimée.\r\n https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id);
					// this.setError('https://www.pivotaltracker.com/n/projects/' + projectId + '/stories/' + tasks[i].story_id + '/tasks/' + tasks[i].id, tasks[i].id);
				}
			}
		}
		return tasksModified;
	}
}
