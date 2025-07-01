import { AbstractControl } from "@angular/forms";

export const passwordMatchValidation= (control: AbstractControl)=>{
    return control.get('password')?.value === control.get('rePassword')?.value ?null : { mismatch: true };
    // let pass = control.get('password')?.value;
    // let rePass = control.get('rePassword')?.value;
    // if(pass === rePass){
    //   return null;
    //   }
    //   else{
    //     return {mismatch: true};
    //   }
  }
