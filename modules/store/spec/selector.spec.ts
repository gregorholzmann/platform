import { cold } from 'jasmine-marbles';
import {
  createSelector,
  createFeatureSelector,
  defaultMemoize,
  createSelectorFactory,
  resultMemoize,
  MemoizedProjection,
} from '@ngrx/store';
import { map, distinctUntilChanged } from 'rxjs/operators';

describe('Selectors', () => {
  let countOne: number;
  let countTwo: number;
  let countThree: number;

  let incrementOne: jasmine.Spy;
  let incrementTwo: jasmine.Spy;
  let incrementThree: jasmine.Spy;

  beforeEach(() => {
    countOne = 0;
    countTwo = 0;
    countThree = 0;

    incrementOne = jasmine.createSpy('incrementOne').and.callFake(() => {
      return ++countOne;
    });

    incrementTwo = jasmine.createSpy('incrementTwo').and.callFake(() => {
      return ++countTwo;
    });

    incrementThree = jasmine.createSpy('incrementThree').and.callFake(() => {
      return ++countThree;
    });
  });

  describe('createSelector', () => {
    it('should deliver the value of selectors to the projection function', () => {
      const projectFn = jasmine.createSpy('projectionFn');

      const selector = createSelector(incrementOne, incrementTwo, projectFn)(
        {}
      );

      expect(projectFn).toHaveBeenCalledWith(countOne, countTwo);
    });

    it('should be possible to test a projector fn independent from the selectors it is composed of', () => {
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector(incrementOne, incrementTwo, projectFn);

      selector.projector('', '');

      expect(incrementOne).not.toHaveBeenCalled();
      expect(incrementTwo).not.toHaveBeenCalled();
      expect(projectFn).toHaveBeenCalledWith('', '');
    });

    it('should call the projector function only when the value of a dependent selector change', () => {
      const firstState = { first: 'state', unchanged: 'state' };
      const secondState = { second: 'state', unchanged: 'state' };
      const neverChangingSelector = jasmine
        .createSpy('unchangedSelector')
        .and.callFake((state: any) => {
          return state.unchanged;
        });
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector(neverChangingSelector, projectFn);

      selector(firstState);
      selector(secondState);

      expect(projectFn).toHaveBeenCalledTimes(1);
    });

    it('should memoize the function', () => {
      const firstState = { first: 'state' };
      const secondState = { second: 'state' };
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector(
        incrementOne,
        incrementTwo,
        incrementThree,
        projectFn
      );

      selector(firstState);
      selector(firstState);
      selector(firstState);
      selector(secondState);

      expect(incrementOne).toHaveBeenCalledTimes(2);
      expect(incrementTwo).toHaveBeenCalledTimes(2);
      expect(incrementThree).toHaveBeenCalledTimes(2);
      expect(projectFn).toHaveBeenCalledTimes(2);
    });

    it('should allow you to release memoized arguments', () => {
      const state = { first: 'state' };
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector(incrementOne, projectFn);

      selector(state);
      selector(state);
      selector.release();
      selector(state);
      selector(state);

      expect(projectFn).toHaveBeenCalledTimes(2);
    });

    it('should recursively release ancestor selectors', () => {
      const grandparent = createSelector(incrementOne, a => a);
      const parent = createSelector(grandparent, a => a);
      const child = createSelector(parent, a => a);
      spyOn(grandparent, 'release').and.callThrough();
      spyOn(parent, 'release').and.callThrough();

      child.release();

      expect(grandparent.release).toHaveBeenCalled();
      expect(parent.release).toHaveBeenCalled();
    });
  });

  describe('createSelector with arrays', () => {
    it('should deliver the value of selectors to the projection function', () => {
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector([incrementOne, incrementTwo], projectFn)(
        {}
      );

      expect(projectFn).toHaveBeenCalledWith(countOne, countTwo);
    });

    it('should be possible to test a projector fn independent from the selectors it is composed of', () => {
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector([incrementOne, incrementTwo], projectFn);

      selector.projector('', '');

      expect(incrementOne).not.toHaveBeenCalled();
      expect(incrementTwo).not.toHaveBeenCalled();
      expect(projectFn).toHaveBeenCalledWith('', '');
    });

    it('should call the projector function only when the value of a dependent selector change', () => {
      const firstState = { first: 'state', unchanged: 'state' };
      const secondState = { second: 'state', unchanged: 'state' };
      const neverChangingSelector = jasmine
        .createSpy('unchangedSelector')
        .and.callFake((state: any) => {
          return state.unchanged;
        });
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector([neverChangingSelector], projectFn);

      selector(firstState);
      selector(secondState);

      expect(projectFn).toHaveBeenCalledTimes(1);
    });

    it('should memoize the function', () => {
      const firstState = { first: 'state' };
      const secondState = { second: 'state' };
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector(
        [incrementOne, incrementTwo, incrementThree],
        projectFn
      );

      selector(firstState);
      selector(firstState);
      selector(firstState);
      selector(secondState);

      expect(incrementOne).toHaveBeenCalledTimes(2);
      expect(incrementTwo).toHaveBeenCalledTimes(2);
      expect(incrementThree).toHaveBeenCalledTimes(2);
      expect(projectFn).toHaveBeenCalledTimes(2);
    });

    it('should allow you to release memoized arguments', () => {
      const state = { first: 'state' };
      const projectFn = jasmine.createSpy('projectionFn');
      const selector = createSelector([incrementOne], projectFn);

      selector(state);
      selector(state);
      selector.release();
      selector(state);
      selector(state);

      expect(projectFn).toHaveBeenCalledTimes(2);
    });

    it('should recursively release ancestor selectors', () => {
      const grandparent = createSelector([incrementOne], a => a);
      const parent = createSelector([grandparent], a => a);
      const child = createSelector([parent], a => a);
      spyOn(grandparent, 'release').and.callThrough();
      spyOn(parent, 'release').and.callThrough();

      child.release();

      expect(grandparent.release).toHaveBeenCalled();
      expect(parent.release).toHaveBeenCalled();
    });
  });

  describe('createFeatureSelector', () => {
    let featureName = '@ngrx/router-store';
    let featureSelector: (state: any) => number;

    beforeEach(() => {
      featureSelector = createFeatureSelector<number>(featureName);
    });

    it('should memoize the result', () => {
      const firstValue = { first: 'value' };
      const firstState = { [featureName]: firstValue };
      const secondValue = { secondValue: 'value' };
      const secondState = { [featureName]: secondValue };

      const state$ = cold('--a--a--a--b--', { a: firstState, b: secondState });
      const expected$ = cold('--a--------b--', {
        a: firstValue,
        b: secondValue,
      });
      const featureState$ = state$.pipe(
        map(featureSelector),
        distinctUntilChanged()
      );

      expect(featureState$).toBeObservable(expected$);
    });
  });

  describe('createSelectorFactory', () => {
    it('should return a selector creator function', () => {
      const projectFn = jasmine.createSpy('projectionFn');
      const selectorFunc = createSelectorFactory(defaultMemoize);

      const selector = selectorFunc(incrementOne, incrementTwo, projectFn)({});

      expect(projectFn).toHaveBeenCalledWith(countOne, countTwo);
    });

    it('should allow a custom memoization function', () => {
      const projectFn = jasmine.createSpy('projectionFn');
      const anyFn = jasmine.createSpy('t').and.callFake(() => true);
      const equalFn = jasmine.createSpy('isEqual').and.callFake(() => true);
      const customMemoizer = (aFn: any = anyFn, eFn: any = equalFn) =>
        defaultMemoize(anyFn, equalFn);
      const customSelector = createSelectorFactory(customMemoizer);

      const selector = customSelector(incrementOne, incrementTwo, projectFn);
      selector(1);
      selector(2);

      expect(anyFn.calls.count()).toEqual(1);
    });

    it('should allow a custom state memoization function', () => {
      const projectFn = jasmine.createSpy('projectionFn');
      const stateFn = jasmine.createSpy('stateFn');
      const selectorFunc = createSelectorFactory(defaultMemoize, { stateFn });

      const selector = selectorFunc(incrementOne, incrementTwo, projectFn)({});

      expect(stateFn).toHaveBeenCalled();
    });
  });

  describe('defaultMemoize', () => {
    it('should allow a custom equality function', () => {
      const anyFn = jasmine.createSpy('t').and.callFake(() => true);
      const equalFn = jasmine.createSpy('isEqual').and.callFake(() => true);
      const memoizer = defaultMemoize(anyFn, equalFn);

      memoizer.memoized(1, 2, 3);
      memoizer.memoized(1, 2);

      expect(anyFn.calls.count()).toEqual(1);
    });
  });

  describe('resultMemoize', () => {
    let projectionFnSpy: jasmine.Spy;
    const ARRAY = ['a', 'ab', 'b'];
    const ARRAY_CHANGED = [...ARRAY, 'bc'];
    const A_FILTER: { by: string } = { by: 'a' };
    const B_FILTER: { by: string } = { by: 'b' };

    let arrayMemoizer: MemoizedProjection;

    // Compare a and b on equality. If a and b are Arrays then compare them
    // on their content.
    function isResultEqual(a: any, b: any) {
      if (a instanceof Array) {
        return a.length === b.length && a.every(fromA => b.includes(fromA));
      }
      // Default comparison
      return a === b;
    }

    beforeEach(() => {
      projectionFnSpy = jasmine
        .createSpy('projectionFn')
        .and.callFake((arr: string[], filter: { by: string }) =>
          arr.filter(item => item.startsWith(filter.by))
        );

      arrayMemoizer = resultMemoize(projectionFnSpy, isResultEqual);
    });

    it('should not rerun projector function when arguments stayed the same', () => {
      arrayMemoizer.memoized(ARRAY, A_FILTER);
      arrayMemoizer.memoized(ARRAY, A_FILTER);

      expect(projectionFnSpy.calls.count()).toBe(1);
    });

    it('should rerun projector function when arguments changed', () => {
      arrayMemoizer.memoized(ARRAY, A_FILTER);
      arrayMemoizer.memoized(ARRAY_CHANGED, A_FILTER);

      expect(projectionFnSpy.calls.count()).toBe(2);
    });

    it('should return the same instance of results when projector function produces the same results array', () => {
      const result1 = arrayMemoizer.memoized(ARRAY, A_FILTER);
      const result2 = arrayMemoizer.memoized(ARRAY, A_FILTER);

      expect(result1).toBe(result2);
    });

    it('should return the same instance of results when projector function produces similar results array', () => {
      const result1 = arrayMemoizer.memoized(ARRAY, A_FILTER);
      const result2 = arrayMemoizer.memoized(ARRAY_CHANGED, A_FILTER);

      expect(result1).toBe(result2);
    });

    it('should return the new instance of results when projector function produces different result', () => {
      const result1 = arrayMemoizer.memoized(ARRAY, A_FILTER);
      const result2 = arrayMemoizer.memoized(ARRAY_CHANGED, B_FILTER);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1).not.toBe(result2);
      expect(result1).not.toEqual(result2);
    });
  });
});
