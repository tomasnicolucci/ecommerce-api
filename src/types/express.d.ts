declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        authUserId: string;
      };
    }
  }
}

export {};