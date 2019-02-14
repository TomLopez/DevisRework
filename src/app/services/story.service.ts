import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StoryService {

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

  public getProjectStories(projects, epic) : Promise<any> {
    console.log('serice info',projects);
    //this.log.setlogProcess("Getting stories from project");
    return new Promise<any>((resolve, reject) => {
      let stories = [];
      let promises: Promise<any>[] = [];
      // console.log("this.epic",this.epic);
      for (let i in projects) {
        let res = this.Angularget("https://www.pivotaltracker.com/services/v5/projects/" + projects[i].id + "/stories" + "?with_label=" + epic)
          .toPromise().then((res: any) => {
            let myCurrentStory: any;
            for (let u in res) {
              myCurrentStory = res[u];
              myCurrentStory.listeTaches = [];
              console.log("myCurrentStory.labels",myCurrentStory.labels);
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
      }
      Promise.all(promises).then(() => {
        // let objectToSend: any = {};
        // objectToSend.stories = stories;
        resolve(stories);
      })
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
