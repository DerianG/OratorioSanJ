import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioperiodosComponent } from './formularioperiodos.component';

describe('FormularioperiodosComponent', () => {
  let component: FormularioperiodosComponent;
  let fixture: ComponentFixture<FormularioperiodosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioperiodosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioperiodosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
