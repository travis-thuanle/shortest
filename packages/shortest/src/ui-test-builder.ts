import { TestRegistry } from './index';
import { TestStep, BeforeAllFunction, AfterAllFunction, ActionType } from './types/test';
import { UITestBuilderInterface } from './types/ui-test-builder';

export class UITestBuilder<T = any> implements UITestBuilderInterface<T> {
  path: string;
  testName: string;
  steps: TestStep[] = [];
  private suiteName: string = '';

  constructor(path: string) {
    this.path = path;
    this.testName = '';
    TestRegistry.registerTest(this);
  }

  test(name: string): this {
    this.testName = name;
    return this;
  }

  setSuiteName(name: string): this {
    this.suiteName = name;
    return this;
  }

  getSuiteName(): string {
    return this.suiteName;
  }

  private isCallbackFunction(value: any): value is () => Promise<void> {
    return typeof value === 'function';
  }

  private createStep(
    type: TestStep['type'],
    description: string,
    callbackOrPayload?: (() => Promise<void>) | T,
    callback?: () => Promise<void>
  ): TestStep {
    const baseStep = {
      type,
      description,
      action: description
    };

    if (!callbackOrPayload) {
      return baseStep;
    }

    if (this.isCallbackFunction(callbackOrPayload)) {
      return {
        ...baseStep,
        callback: callbackOrPayload,
        hasCallback: true
      };
    }

    return {
      ...baseStep,
      payload: callbackOrPayload,
      callback,
      hasCallback: !!callback
    };
  }

  given(description: string, callbackOrPayload?: (() => Promise<void>) | T, callback?: () => Promise<void>): this {
    this.steps.push(this.createStep('GIVEN', description, callbackOrPayload, callback));
    return this;
  }

  when(description: string, callbackOrPayload?: (() => Promise<void>) | T, callback?: () => Promise<void>): this {
    this.steps.push(this.createStep('WHEN', description, callbackOrPayload, callback));
    return this;
  }

  expect(description: string, callbackOrPayload?: (() => Promise<void>) | T, callback?: () => Promise<void>): this {
    this.steps.push(this.createStep('EXPECT', description, callbackOrPayload, callback));
    return this;
  }

  before(actionOrFn: ActionType | BeforeAllFunction, payload?: T): this {
    if (typeof actionOrFn === 'function') {
      this.addStep('BEFORE', 'EXECUTE_FUNCTION', actionOrFn);
    } else {
      this.addStep('BEFORE', typeof actionOrFn === 'string' ? actionOrFn : 'SET_STATE', payload);
    }
    return this;
  }

  after(actionOrFn: ActionType | AfterAllFunction, payload?: T): this {
    if (typeof actionOrFn === 'function') {
      this.addStep('AFTER', 'EXECUTE_FUNCTION', actionOrFn);
    } else {
      this.addStep('AFTER', typeof actionOrFn === 'string' ? actionOrFn : 'SET_STATE', payload);
    }
    return this;
  }

  private async addStep(
    type: TestStep['type'], 
    action: string, 
    payload?: any,
    callback?: () => Promise<void>
  ): Promise<void> {
    this.steps.push({ 
      type, 
      description: action,
      action,
      payload, 
      callback,
      hasCallback: !!callback
    });
    
    if (callback) {
      try {
        await callback();
      } catch (error: any) {
        throw error;
      }
    }
  }
}
  