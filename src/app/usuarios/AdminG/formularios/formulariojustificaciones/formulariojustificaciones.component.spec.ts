import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulariojustificacionesComponent } from './formulariojustificaciones.component';

describe('FormulariojustificacionesComponent', () => {
  let component: FormulariojustificacionesComponent;
  let fixture: ComponentFixture<FormulariojustificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulariojustificacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulariojustificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
