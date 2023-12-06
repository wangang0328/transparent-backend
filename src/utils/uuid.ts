import { randomBytes } from 'crypto'
export const uuid = (len = 26) => randomBytes(len).toString('hex').slice(0, len);