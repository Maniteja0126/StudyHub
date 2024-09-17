import { Router, Request, Response } from "express";
import { prismaClient } from "../db";
import { authMiddleware } from "../middleware";

interface AuthenticatedRequest extends Request {
  userId?: number;
}

const router = Router();

// 1. POST: Create a new session (start a task session)
router.post("/new-session", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, startTime } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is missing" });
  }

  try {
    const task = await prismaClient.task.findUnique({
      where: { id: Number(taskId), userId: userId },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found or user not authorized" });
    }

    const session = await prismaClient.session.create({
      data: {
        userId: userId,
        taskId: Number(taskId),
        startTime: new Date(startTime),
      },
    });

    res.status(201).json({ message: "Session created successfully", session });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. GET: Get all sessions for the logged-in user
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is missing" });
  }

  try {
    const sessions = await prismaClient.session.findMany({
      where: { userId: userId },
      include: { task: true },
    });

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. GET: Get a specific session by its ID
router.get("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const session = await prismaClient.session.findFirst({
      where: {
        id: Number(id),
        userId: userId,
      },
      include: { task: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 4. PUT: Update a session (set endTime, totalTime)
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { endTime } = req.body;
  const userId = req.userId;

  try {
    const session = await prismaClient.session.findFirst({
      where: { id: Number(id), userId: userId },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const updatedSession = await prismaClient.session.update({
      where: { id: Number(id) },
      data: {
        endTime: new Date(endTime),
        totalTime: Math.floor((new Date(endTime).getTime() - session.startTime.getTime()) / 1000), 
      },
    });

    res.status(200).json({ message: "Session updated successfully", updatedSession });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 5. DELETE: Delete a session by ID
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const session = await prismaClient.session.findFirst({
      where: { id: Number(id), userId: userId },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await prismaClient.session.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const sessionRouter = router;
