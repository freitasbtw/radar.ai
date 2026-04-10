import { Request, Response } from 'express';

export const homeController = {
  index(req: Request, res: Response) {
    res.json({ message: 'Hello from the Backend!' });
  }
};
