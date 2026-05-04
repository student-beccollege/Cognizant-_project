import { Component } from '@angular/core';
import {FormsModule,NgForm} from '@angular/forms'
import {CommonModule} from '@angular/common';
import {AuthService} from '../service/auth';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-registration',
  standalone:true,
  imports: [FormsModule,CommonModule],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class Registration {
   iserror:boolean=false;
    message:String='';

    constructor(private authService:AuthService,
        private cdr: ChangeDetectorRef)
    {

    }
   onsubmit(form:NgForm)
   {
        this.authService.register(form.value).subscribe({
            next:(response:any)=>{
              this.iserror=false;
              this.message = response.message;
              this.cdr.detectChanges();
              }
            ,
            error:(error:any)=>
            {
               this.iserror=true;
               this.message=error.error.message;
               this.cdr.detectChanges();
              }

        })
  }
}

