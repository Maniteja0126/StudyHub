import { Router, Request, Response } from "express";
import { taskSchema } from "../types";
import { prismaClient } from "../db";
import { authMiddleware } from "../middleware";

interface AuthenticatedRequest extends Request {
    userId?: number;
}

const router = Router();

// POST: Add a new task (title, description, due date, priority, status).
router.post("/new-task", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body;
    const parsedData = taskSchema.safeParse(body);

    if (!parsedData.success) {
        return res.status(411).json({ message: "Incorrect Inputs" });
    }

    const userId = req.userId;

    if (userId === undefined) {
        return res.status(400).json({ message: "User ID is missing" });
    }

    try {
        const task = await prismaClient.task.create({
            data: {
                title: parsedData.data.title ?? '',
                description: parsedData.data.description ?? '',
                status: parsedData.data.status ?? 'to_do',
                priority: parsedData.data.priority ?? 'low',
                dueDate: parsedData.data.dueDate ?? null,
                user: {
                    connect: { id: userId }
                }
            }
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: "Internal server error from task manager" });
    }
});

// GET: Retrieve tasks for the authenticated user based on filters.
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { status, priority, dueDate, search, skip = 0, take = 10 } = req.query;
    const userId = req.userId;

    if (userId === undefined) {
        return res.status(400).json({ message: "User ID is missing" });
    }

    const filters: any = { userId };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (dueDate) filters.dueDate = { gte: new Date(dueDate as string) };
    if (search) filters.title = { contains: search as string, mode: 'insensitive' };

    try {
        const tasks = await prismaClient.task.findMany({
            where: filters,
            skip: Number(skip),
            take: Number(take),
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found for the given query parameters" });
        }

        res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error from task manager" });
    }
});

router.get("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const task = await prismaClient.task.findUnique({
            where: { id: Number(id) }
        });

        if (!task || task.userId !== userId) {
            return res.status(404).json({ message: "Task not found or access denied" });
        }

        res.status(200).json(task);
    } catch (error) {
        console.error("Error fetching goal:", error);
        res.status(500).json({ message: "Internal server error from goal manager" });
    }
});

// PUT: Update an existing task that belongs to the authenticated user.
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const body = req.body;
    const userId = req.userId;

    if (userId === undefined) {
        return res.status(400).json({ message: "User ID is missing" });
    }

    try {
        const parsedData = taskSchema.safeParse(body);
        if (!parsedData.success) {
            return res.status(411).json({ message: "Incorrect Inputs" });
        }

        const task = await prismaClient.task.findUnique({
            where: { id: Number(id), userId }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found or does not belong to this user" });
        }

        await prismaClient.task.update({
            where: { id: Number(id) },
            data: {
                title: parsedData.data.title,
                description: parsedData.data.description,
                status: parsedData.data.status,
                priority: parsedData.data.priority,
                dueDate: parsedData.data.dueDate
            }
        });

        res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error from task manager" });
    }
});

// DELETE: Delete a specific task that belongs to the authenticated user.
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    if (userId === undefined) {
        return res.status(400).json({ message: "User ID is missing" });
    }

    try {
        const task = await prismaClient.task.findFirst({
            where: { id: Number(id), userId }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found or does not belong to this user" });
        }

        await prismaClient.task.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error from task manager" });
    }
});

export const taskManager = router;
