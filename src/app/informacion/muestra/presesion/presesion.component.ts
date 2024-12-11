import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterOutlet,RouterLink, RouterLinkActive } from '@angular/router';
import { hasEmailError, isRequired } from '../../utils/validator';
interface FormSign{
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}
@Component({
  selector: 'app-presesion',
  standalone: true,
  imports: [RouterLink,ReactiveFormsModule],
  templateUrl: './presesion.component.html',

})
export default class PresesionComponent {
  private _formBuilder = inject(FormBuilder);

  isRequired(field: 'email' | 'password') {
    return isRequired(field, this.form);
  }
  hasEmailError() {
    return hasEmailError(this.form);
  }

  form = this._formBuilder.group<FormSign>({ 
    email:this._formBuilder.control('', [
      Validators.required, 
      Validators.email,
     ]),
    password:this._formBuilder.control('', Validators.required),
  });

  submit(){
    if (this.form.invalid) return;

    const {email,password} = this.form.value

    if ( !email || !password ) return

    console.log(email,password);
  }
}
