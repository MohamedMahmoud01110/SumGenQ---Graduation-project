import { Validators } from "@angular/forms";

export const NameValidators = [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(20)
];

export const EmailValidators = [

    Validators.required,
    Validators.email

]
export const PasswordValidators = [
  Validators.required,
  Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  ]
