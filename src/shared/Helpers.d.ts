

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