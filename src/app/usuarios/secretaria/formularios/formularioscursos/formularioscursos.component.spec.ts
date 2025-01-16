import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioscursosComponent } from './formularioscursos.component';

describe('FormularioscursosComponent', () => {
  let component: FormularioscursosComponent;
  let fixture: ComponentFixture<FormularioscursosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioscursosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioscursosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
