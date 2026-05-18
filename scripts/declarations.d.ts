declare module 'unbzip2-stream' {
  import { Transform } from 'node:stream';
  function unbzip2(): Transform;
  export = unbzip2;
}
