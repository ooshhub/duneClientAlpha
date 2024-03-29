// global client types

declare global {

  type genericJson = { [key: string]: any }

  type anyClass = new (...args: any[]) => any;

  type dummyFunction = (...args: any[]) => void;

  type anyFunction = (...args: any[]) => any;

  type DummyProvider = { [key: string]: dummyFunction; }

}

export {};