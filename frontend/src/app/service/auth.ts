import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
      private apiurl="http://localhost:8081/api/auth";
      constructor(private http:HttpClient){
        }
      register(userdata:any):Observable<any>
      {
        return  this.http.post(`${this.apiurl}/register`,userdata,{});
      }

      login(userdata:any):Observable<any>
      {
          return this.http.post(`${this.apiurl}/login`,userdata,{});
        }

      logout():Observable<any>
      {
          return this.http.post(`${this.apiurl}/logout`,{});
        }

      me():Observable<any>
      {
          return this.http.get(`${this.apiurl}/me`);
        }
  }

