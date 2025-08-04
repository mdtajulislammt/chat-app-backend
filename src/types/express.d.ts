declare namespace Express {
    interface UserPayload {
      userId: number;
      username: string;
      email: string;
    }
  
    interface Request {
      user?: UserPayload;
    }
  }
  