declare module "jsonwebtoken" {
    export interface JwtPayload {
      id: string
      email: string
      role: string
      iat?: number
      exp?: number
    }
  
    export function sign(payload: string | object | Buffer, secretOrPrivateKey: string | Buffer, options?: object): string
  
    export function verify(token: string, secretOrPublicKey: string | Buffer): string | JwtPayload
  }
  