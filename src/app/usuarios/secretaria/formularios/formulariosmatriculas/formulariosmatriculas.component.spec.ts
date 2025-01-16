import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulariosmatriculasComponent } from './formulariosmatriculas.component';

describe('FormulariosmatriculasComponent', () => {
  let component: FormulariosmatriculasComponent;
  let fixture: ComponentFixture<FormulariosmatriculasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulariosmatriculasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulariosmatriculasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
