import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormsModule,NgForm} from '@angular/forms'
import {CommonModule} from '@angular/common';
import {AuthService} from '../service/auth';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule,FormsModule, RouterLink ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  logdata={
    username:"",
    password:""
    }
  message:String="";
  iserror: boolean = false;
    constructor(private authService:AuthService,private cdr: ChangeDetectorRef,private router: Router)
        {

        }
    onsubmit(Form:NgForm)
    {
        this.authService.login(Form.value).subscribe(
          {
            next: (response: any) => {
              console.log("Check this response:", response);

                 if (response.id) {
                      localStorage.setItem('userId', response.id.toString());
                    }
                this.message = response.message;
                this.cdr.detectChanges();

                // 1. Calculate the expiry time
                const expiryTime = new Date().getTime() + (30 * 60 * 1000);

                // 2. Navigate and PASS the state data
                this.router.navigate(['/home'], {
                    state: {
                        user: Form.value.username, // Use Form.value.username from the NgForm
                        expiry: expiryTime
                    }
                });
            },

              error:(error:any)=>{
                this.message=error.error.message;
                this.cdr.detectChanges();
                }
           });

    }
  }
