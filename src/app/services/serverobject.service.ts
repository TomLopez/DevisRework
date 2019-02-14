import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http/';

@Injectable({
  providedIn: 'root'
})
export class ServerobjectService {
  constructor(private http: HttpClient) {
	}

	public Angularget(configUrl) {
		return this.http.get(configUrl);
	}

	public getProjetStructure() {
		return new Promise((resolve, reject) => {
			this.Angularget("http://localhost/DevisAPI/api/Projet/getStructure").toPromise().then((res) => {
				resolve(res);
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public getStoriesStructure() {
		return new Promise((resolve, reject) => {
			this.Angularget("http://localhost/DevisAPI/api/Stories_d/getStructure").toPromise().then((res) => {
				resolve(res);
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public getTasksStructure() {
		return new Promise((resolve, reject) => {
			this.Angularget("http://localhost/DevisAPI/api/Tasks_d/getStructure").toPromise().then((res) => {
				resolve(res);
			}).catch((error) => {
				reject(error);
			});
		});
	}
}
