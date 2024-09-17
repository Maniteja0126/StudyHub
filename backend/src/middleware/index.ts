import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';


interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization as string;
    const jwtSecret = process.env.JWT_SECRET || "";

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const payload = jwt.verify(token, jwtSecret) as { id: string }; 
        req.userId = payload.id;
        next();
    } catch (e) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
