// shared helpers for Browser environment, NO NODE IMPORTS
import * as convert from './Colours';

type ParallelLoaderRequest = {
  timeout?: number,
  load: Promise<void|any>,
  name: string,
}

type ParallelLoaderResult = {
  err: number,
  msg: string,
  stack: string | null,
}
type ParallelLoaderResults = {
  failures: number,
  msgs: string[],
  errs: string[],
}

type svgConversionData = {
  svgAttributes: string,
  styles: object[],
  paths: object[],
}

export class Helpers {

  constructor() { throw new Error(`${this.constructor.name}: this class cannot be instantiated.`) }
  
  static #debug;

  static get debug(): ((...args:string[]) => void | void) { return this.#debug }
  static set debug(debuggerLink) {
    this.#debug = debuggerLink || console.log;
    this.#debug('Helpers logger set');
  }

/* 
// 1. ASYNC, TIMING & PROCESS FUNCTIONS
*/

  /**
   * Simple async timeout
   * @param {number} ms - number of milliseconds to wait
   * @returns {void}
   */
  static async timeout(ms: number): Promise<void> { return new Promise(res => setTimeout(() => res(), ms)) }

  /**
   * Simple condition watcher
   * @param func - function to return true or false
   * @param message - error message on fail
   * @param timeout - max time to wait in milliseconds
   * @param timeStep - interval to check condition at in milliseconds
   * @returns 
   */
  static async watchCondition(func: (...args: any) => boolean, message?: string, timeout = 5000, timeStep = 100): Promise<boolean> {
    return new Promise(res => {
      let elapsed = 0;
      const loop = setInterval(() => {
        if (func()) {
          clearInterval(loop);
          res(true);
          if (message) console.log(message);
        } else if (elapsed >= timeout) {
          res(false)
        }
        elapsed += timeStep;
      }, timeStep)
    });
  }
  // Load an async process against a timer. Default is 5000ms. Input in the form of:
  // 		{ name: myProcessName, load: myFunc(parameter), [timeout]: 8000 }
  // Returns an object with { err: 0 or 1, msg: string, stack: Error stack if applicable }
  // Timeout returns null, therefore any functions supplied as the payload CANNOT return 'null' on a success
  static async asyncTimedLoad(loadPart: ParallelLoaderRequest): Promise<ParallelLoaderResult> {
    const defaultTimeout = 6000;
    const timer = loadPart.timeout ?? defaultTimeout;
    return new Promise(res => {
      Promise.race([ 
        loadPart.load,
        this.timeout(timer)
      ]).then((partResult: any) => {
        const result = (partResult === null) ? { err: 1, msg: `${loadPart.name}: timeout at ${timer}ms`, stack: '' }
          : (/error/i.test(partResult?.constructor?.name ?? '')) ? { err: 1, msg: `${loadPart.name}: ${partResult.message}`, stack: partResult.stack ?? '' }
          // : (partResult === undefined) ? { err: 1, msg: partResult || `${loadPart.name}: Unknown Error` }
          : { err: 0, msg: `${loadPart.name}: Successful load.`, stack: null };
        res(result);
      }).catch(err => {
        res({ err: 1, msg: err.message??err, stack: err.stack });
      });
    });
  }
  // Load an array of async processes to load. Same input as asyncTimedLoad, but an Array of processes.
  // Returns an object { failures: integer, errs: Array of error messages & stacktraces, msgs: Array of success msgs }
  // If returnObject.failures === 0, parallel load was successful.
  static async parallelLoader(loaderArray: ParallelLoaderRequest[]): Promise<ParallelLoaderResults> {
    const promiseArray = loaderArray.map(part => this.asyncTimedLoad(part)),
      loaderResult = await Promise.all(promiseArray),
      output: ParallelLoaderResults = { failures: 0, msgs: [], errs: [] };
    loaderResult.forEach(subResult => {
      if (subResult.err) {
        output.failures += 1;
        output.errs.push(`${subResult.msg}${subResult.stack ? `\n===Stack===\n${subResult.stack}` : ''}`);
      } else {
        output.msgs.push(subResult.msg);
      }
    });
    return output;
  }


  /* 
  // DATA FUNCTIONS
  */
  // Bind all methods in a class - call at end of constructor
  static bindAll(inputClass: anyClass): void {
    const keys = Reflect.ownKeys(Reflect.getPrototypeOf(inputClass) ?? {});
    keys.forEach(key => {
      if (typeof(inputClass[key]) === 'function' && key !== 'constructor') {
        inputClass[key] = inputClass[key].bind(inputClass);
      }
    });
  }
  static toArray(inp: any): any[] { return Array.isArray(inp) ? inp : [inp] }

  static cloneObject(inp: object): object|null {
    try { return JSON.parse(JSON.stringify(inp)) }
    catch(e) { return null }
  }
  // Generate a player ID
  // Format is 
  //  -first letter of process.env.USERNAME (or random letter if not found)
  //  -underscore
  //  -18 alphanumeric characters made from username (or random) and Date.now()
  // is usable as object key name, and distinct from socket.io which doesn't use underscore
  static generatePlayerId(pName:string):string {
    const randLetter = async(): Promise<string> => String.fromCharCode(Math.random() > 0.3 ? Math.ceil(Math.random()*26) + 64 : Math.ceil(Math.random()*26) + 96);
    if (!pName) {
      for (let i = Math.ceil(Math.random()*3) + 4; i > 0; i--) {
        pName += randLetter();
      }
    }
    let name = pName.split('').reduce((a,v) => a += v.charCodeAt(0), '');
    name = parseInt(name).toString(36).replace(/0*$/, '');
    const time = (Math.floor(Date.now())).toString(16);
    let pid = `${time}${name}`;
    if (pid.length > 20) pid = pid.slice(0,20);
    else if (pid.length < 20) { for(let i = (20 - pid.length); i > 0; i--) { pid += randLetter() } }
    pid = `${pName[0]}_${pid.slice(2)}`;
    return pid;
  }
  // static generateHouseIds(playerList) {
  //   const output = {};
  //   let increment = 1;
  //   for (const p in playerList) {
  //     const pid = playerList[p].pid, houseInitial = playerList[p].house[0];
  //     const hid = `${pid[0]}${houseInitial}_${increment}${pid.slice(2)}`.slice(0,20);
  //     Object.assign(output, { [pid]: hid });
  //     increment ++;
  //   }
  //   return output;
  // }
  // static randomInt(range=100, depth=32) {
  //   const max = range * 2**depth;
  //   let random;
  //   do { random = Math.floor(Math.random() * 2**depth) }
  //   while (random >= max);
  //   return random % range;
  // }
  // static generateUID(numIds = 1) {
  //   let output = [], key = '';
  //   const chars = '-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
  //   let ts = Date.now();
  //   for (let i = 8; i > 0; i--) { output[i] = chars.charAt(ts % 64), ts = Math.floor(ts / 64) }
  //   for (let j = 0; j < 12; j++) { output.push(chars.charAt(this.randomInt(64))) }
  //   key = output.join('');
  //   if (numIds > 1) {
  //     numIds = Math.min(32, numIds);
  //     output = Array(numIds).fill().map((v,i) => {
  //       const lastChar = chars[(chars.indexOf(key[19])+i)%64];
  //       return `${key.slice(0,18)}${lastChar}`;
  //     });
  //     return output;
  //   } else return key;
  // }
  // Convert a string path to a nested object reference
  // e.g. getObjectPath(myObj, 'config/player/playerName) returns myObj.config.player.playerName
  // Set createPath to false to disabled creating missing keys. Will return null if path not found
  static getObjectPath(baseObject: object, pathString: string, createPath=true): object {
    const parts = pathString.split(/\/+/g),
      objRef = (pathString) 
      ? parts.reduce((m,v) => {
        if (!m) return;
        if (!m[v]) {
          if (createPath) m[v] = {};
          else return null;
        }
        return m[v];}, baseObject)
      : baseObject;
    return objRef;
  }
  // Remove cyclic references from an object, supply stringify flag if required
  static removeCyclicReferences(inputObj: object, stringify: boolean): string|object {
    const getCircularReplacer = (): any => {
      const seen = new WeakSet();
      return (_key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      };
    };
    let output;
    try { output = JSON.stringify(inputObj, getCircularReplacer()) } catch(e) { console.error(e) }
    return stringify ? output : JSON.parse(output);
  }
  // Flatten an object to a single level. Key names become the/original/nested/path.
  // Currently only saves String values
  static flattenObjectPaths(rootObject: object, rootPath=''): object {
    const output = {};
    const processObject = (currentObject: object, currentPath: string): object => {
      for (const key in currentObject) {
        if (typeof(currentObject[key]) === 'string') output[`${currentPath}${key}`] = currentObject[key];
        else if (typeof(currentObject[key]) === 'object') processObject(currentObject[key], `${currentPath}${key}/`);
      }
      return output;
    }
    return processObject(rootObject, rootPath);
  }
  static unFlattenObjectPaths(rootObject: object): object {
    const output = {};
    for (const key in rootObject) {
      const pathArray = key.split(/\//g);
      pathArray.reduce((a,v,i) => {
        if (i === (pathArray.length-1)) a[v] = rootObject[key];
        else {
          if (!a[v]) a[v] = {};
          return a[v];
        }
      }, output);
    }
    return output;
  }


  /*
  // HTML / JS / CSS FUNCTIONS
  */
  static windowFade(targetFrame: ElectronBrowserWindow, duration: number, direction?: string, timeStep = 10): Promise<boolean> {
      return new Promise(res => {
      const opacityStep = timeStep/duration,
        uOpacity = targetFrame.getOpacity() ?? null;
      if (uOpacity === null) {
        console.log(`No opacity found on target Electron frame.`);
        res(false);
      }
      direction = /^(in|out)/.test(`${direction}`) ? direction
        : (uOpacity < 0.5) ? 'in'
        : 'out';
      let opacity = uOpacity;
      const fadeLoop = setInterval(() => {
        if ((direction === 'in' && opacity >= 1)
        || (direction === 'out' && opacity <= 0)) {
          clearInterval(fadeLoop);
          res(true);
        } else {
          if (direction === 'in') opacity += opacityStep;
          if (direction === 'out') opacity -= opacityStep;
          targetFrame.setOpacity(opacity);
        }
      }, timeStep);
    });
  }

  static svgStringToData(textStream: string): svgConversionData {
    const output: svgConversionData = { svgAttributes: '', styles: [], paths: [] }
    textStream = textStream.replace(/\n\t/g, '');
    const styles = textStream.match(/<style.*?>(.*)<\/style>/s)?.[1] ?? '',
      attributes = textStream.match(/<svg([^>]*)>/)?.[0] || '',
      pathMatches = textStream.matchAll(/<(polygon|path|polyline|circle|ellipse|line|rect)([^/]*)\//gs);
    output.svgAttributes = attributes;
    const stylesParts = styles.split(/}/g) || [];
    stylesParts.forEach(part => {
      const ruleParts = part.split(/{/).filter(v=>v);
      if (ruleParts.length === 2) output.styles.push({ selector: ruleParts[0], rule: ruleParts[1] });
      // else console.log(`Invalid CSS rule ignored.: "${part}"`);
    });
    for (const path of pathMatches) {
      // console.log(path);
      const outputPath = { type: path[1] };
      const attributes = path[2].matchAll(/(\w+)="([^"]*)"/g);
      for (const attr of attributes) {
        // if (attr[1] === 'points' || attr[1] === 'd') outputPath[attr[1]] = attr[2].split(/\s+/g).filter(v=>v);
        outputPath[attr[1]] = attr[2];
      }
      output.paths.push(outputPath);
    }
    return output;
  }
  
  /**
   * COLOUR FUNCTIONS
   */
  // Disallow House colours too close to white
  static normaliseHsl(hexColor: string): any {
    const satMax = 100, satMin = 40, lumMax = 80, lumMin = 10;
    const hsl = convert.hexToHsl(hexColor);
    if ('stack' in hsl) {
      this.#debug?.log(`Error converting color: ${hexColor}`, hsl);
      return null;
    }
    // console.log(hsl);
    hsl[1] = Math.min(Math.max(hsl[1], satMin), satMax);
    hsl[2] = Math.min(Math.max(hsl[2], lumMin), lumMax);
    return convert.hslToHex(hsl);
  }
  // Promisified requestAnimationFrame to grab the next free animation cycle
  static async animationFrameBreak(): Promise<void> { return new Promise(res => requestAnimationFrame(() => res())) }


  /**
   * OTHER FUNCTIONS
   */
  static emproper(input: string): string {
    if (typeof(input) !== 'string') return '';
    const words = input.replace(/_/g, ' ').trim().split(/\s+/g),
      Words = words.map(w => `${w[0].toUpperCase()}${w.slice(1)}`);
    return Words.join(' ');
  }
  static escapeRegex(string: string): string { return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&') }

  static camelise(inp: string, options = {enforceCase:true}): string|null {
    if (typeof(inp) !== 'string') return null;
    const words = inp.split(/[\s_]+/g).filter(v=>v);
    return words.map((w,i) => {
      const wPre = i > 0 ? w[0].toUpperCase() : w[0].toLowerCase();
      const wSuf = options.enforceCase ? w.slice(1).toLowerCase() : w.slice(1);
      return `${wPre}${wSuf}`;
    }).join('');
  }

  static deCamelise(inp: string, options = {includeNumerals:true}): string|null {
    if (typeof(inp) !== 'string') return null;
    const rxJoins = options.includeNumerals ? /([\w])([A-Z0-9])/g : /([\w])([A-Z])/g ;
    let arr, output = inp;
    while ((arr = rxJoins.exec(inp))?.[0]) {
      output = output.replace(arr[0], `${arr[1]} ${arr[2]}`);
      rxJoins.lastIndex -= 1;
    }
    return output;
  }

  static bound(inputNumber: number, min=0, max = Number.MAX_SAFE_INTEGER): number {
    return (typeof inputNumber === 'number') ? Math.max(Math.min(inputNumber, max), min) : NaN;
  }
  static isBound(inputNumber: number, min=0, max=Number.MAX_SAFE_INTEGER): boolean|null {
    return (typeof inputNumber === 'number') ? inputNumber >= min && inputNumber <= max ? true : false : null;
  }

}