import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { roldguardsGuard } from './roldguards.guard';

describe('roldguardsGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => roldguardsGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
