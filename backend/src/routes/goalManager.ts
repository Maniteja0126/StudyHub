import { Router, Request, Response } from "express";
import { prismaClient } from "../db";
import { authMiddleware } from "../middleware";
import { goalSchema } from "../types";

interface AuthenticatedRequest extends Request {
    userId?: number;
}

const router = Router();

// Create a new goal
router.post("/new-goal", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const body = req.body;
        const parsedData = goalSchema.safeParse(body);

        if (!parsedData.success) {
            return res.status(400).json({ message: "Invalid request body", errors: parsedData.error.errors });
        }

        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        await prismaClient.goal.create({
            data: {
                title: parsedData.data.title,
                description: parsedData.data.description,
                targetDate: parsedData.data.targetDate,
                progress: parsedData.data.progress,
                user: {
                    connect: { id: userId }
                }
            }
        });
        res.status(201).json({ message: "Goal created successfully" });
    } catch (error) {
        console.error("Error creating goal:", error);
        res.status(500).json({ message: "Internal server error from goal manager" });
    }
});

// Get all goals for the authenticated user
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        const goals = await prismaClient.goal.findMany({
            where: { userId }
        });
        if(goals.length === 0){
            return res.status(404).json({ message: "No goals found for the user" });
        }
        res.status(200).json(goals);
    } catch (error) {
        console.error("Error fetching goals:", error);
        res.status(500).json({ message: "Internal server error from goal manager" });
    }
});

// Get a specific goal by ID (only if it belongs to the authenticated user)
router.get("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const goal = await prismaClient.goal.findUnique({
            where: { id: Number(id) }
        });

        if (!goal || goal.userId !== userId) {
            return res.status(404).json({ message: "Goal not found or access denied" });
        }

        res.status(200).json(goal);
    } catch (error) {
        console.error("Error fetching goal:", error);
        res.status(500).json({ message: "Internal server error from goal manager" });
    }
});

// Update a goal by ID (only if it belongs to the authenticated user)
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const body = req.body;
        const parsedData = goalSchema.safeParse(body);

        if (!parsedData.success) {
            return res.status(400).json({ message: "Invalid request body", errors: parsedData.error.errors });
        }

        const goal = await prismaClient.goal.findUnique({
            where: { id: Number(id) }
        });

        if (!goal || goal.userId !== userId) {
            return res.status(404).json({ message: "Goal not found or access denied" });
        }

        await prismaClient.goal.update({
            where: { id: Number(id) },
            data: {
                title: parsedData.data.title,
                description: parsedData.data.description,
                targetDate: parsedData.data.targetDate,
                progress: parsedData.data.progress
            }
        });

        res.status(200).json({ message: "Goal updated successfully" });
    } catch (error) {
        console.error("Error updating goal:", error);
        res.status(500).json({ message: "Internal server error from goal manager" });
    }
});

// Delete a goal by ID (only if it belongs to the authenticated user)
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const goal = await prismaClient.goal.findUnique({
            where: { id: Number(id) }
        });

        if (!goal || goal.userId !== userId) {
            return res.status(404).json({ message: "Goal not found or access denied" });
        }

        await prismaClient.goal.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({ message: "Goal deleted successfully" });
    } catch (error) {
        console.error("Error deleting goal:", error);
        res.status(500).json({ message: "Internal server error from goal manager" });
    }
});

// Update goal progress by ID (only if it belongs to the authenticated user)
router.put("/:id/progress", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { progress } = req.body;
        const userId = req.userId;

        if (typeof progress !== 'number' || progress < 0 || progress > 100) {
            return res.status(400).json({ message: 'Invalid progress value. It should be a number between 0 and 100.' });
        }

        const goal = await prismaClient.goal.findUnique({
            where: { id: Number(id) }
        });

        if (!goal || goal.userId !== userId) {
            return res.status(404).json({ message: 'Goal not found or access denied' });
        }

        await prismaClient.goal.update({
            where: { id: Number(id) },
            data: { progress }
        });

        res.status(200).json({ message: 'Goal progress updated successfully' });
    } catch (error) {
        console.error("Error updating goal progress:", error);
        res.status(500).json({ message: 'Internal server error from goal manager' });
    }
});

export const goalRouter = router;
