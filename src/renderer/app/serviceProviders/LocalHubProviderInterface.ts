export interface LocalHubServiceInterface {
  name: string,
  trigger: (eventName: string, eventData?: genericJson) => void;
  on: (eventName: string, callback: (...args:any[]) => any, priority?: number) => void;
  once: (eventName: string, callback: (...args:any[]) => any, priority?: number) => void;
  off: (eventName: string, callback: (...args:any[]) => any) => void;
  for: (destination: string, callback: (...args:any[]) => any, priority?: number) => void;
}