import { Component } from '@angular/core';
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
                this.message = response.message;
                this.cdr.detectChanges();

                if (response.role === 'ADMIN') {
                  this.router.navigate(['/admin-dashboard']);
                } else {
                  this.router.navigate(['/home']);
                }
            },

              error:(error:any)=>{
                this.message=error.error.message;
                this.cdr.detectChanges();
                }
           });

    }
  }
