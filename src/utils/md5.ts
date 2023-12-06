import * as crypto from 'crypto';

export const md5 = (v: string) => {
  const hash = crypto.createHash('md5');
  hash.update(v);
  return hash.digest('hex');
};
