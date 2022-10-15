// shared helper functions requiring Node imports
import fs from 'fs/promises';
// import { Helpers as browserHelpers } from './Helpers.mjs';

export class Helpers {

/* 
// 1. FILE SYSTEM
*/
  /**
   * Read a file from the local file system
   * @param {string} filePath - path and filename
   * @param {boolean} outputJson - return a JSON instead of string
   * @returns {string | object}
   */
  static async getFile(filePath: string): Promise<string>;
  static async getFile(filePath: string, outputJson): Promise<genericJson>;

	static async getFile(filePath: string, outputJson?: unknown): Promise<unknown> { // move to helpers later
    let output: (string | object);
    await fs.readFile(filePath, 'utf-8').then((resp) => {
      if (outputJson) output = JSON.parse(resp);
      else output = resp;
    }).catch((e) => { throw e })
    return output!;
  }

  /**
   * Save a file to the local filesystem
   * @param filePath - path and filename to save
   * @param data - string data to save to file
   * @param timer - maximum time to attempt write
   * @returns {Promise<boolean>}
   */
  static async saveFile(filePath: string, data: string, timer = 10000): Promise<boolean> {
    const result = await Promise.race([
      fs.writeFile(filePath, data),
      this.timeout(timer)
    ]);
    return result === undefined ? true : false;
  }

/*
// 2. OTHER
*/
  /**
   * 
   * @param timer - number of milliseconds to wait
   * @returns {Promise<void>}
   */
  static async timeout(timer = 2000): Promise<void> {
    return new Promise(res => setTimeout(() => res(), timer));
  }


}