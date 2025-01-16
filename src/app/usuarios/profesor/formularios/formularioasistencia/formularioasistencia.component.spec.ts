import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioasistenciaComponent } from './formularioasistencia.component';

describe('FormularioasistenciaComponent', () => {
  let component: FormularioasistenciaComponent;
  let fixture: ComponentFixture<FormularioasistenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioasistenciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioasistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
