import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { loginGuardsGuard } from './login-guards.guard';

describe('loginGuardsGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => loginGuardsGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
