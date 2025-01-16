import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulariousuariosComponent } from './formulariousuarios.component';

describe('FormulariousuariosComponent', () => {
  let component: FormulariousuariosComponent;
  let fixture: ComponentFixture<FormulariousuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulariousuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulariousuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
