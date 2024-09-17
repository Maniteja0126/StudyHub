import { Router  ,Request , Response} from "express";
import { prismaClient } from "../db";
import { authMiddleware } from "../middleware";
import { noteSchema } from "../types";

const router = Router();
interface AuthenticatedRequest extends Request {
    userId?: number;
}
// Creates a new note for the authenticated user
router.post('/new-note', authMiddleware, async(req : AuthenticatedRequest,res : Response)=>{
    try {
        const body = req.body;
        const parsedData = noteSchema.safeParse(body);
        if(!parsedData.success){
            return res.status(400).json({ message: "Invalid request body", errors: parsedData.error.errors });
        }
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }
        await prismaClient.note.create({
            data : {
                userId : userId ,
                title : body.title ,
                content : body.content ,
            }
        });
        res.status(201).json({ message: "Notes created successfully" });

    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ message: "Internal server error from note manager" });
    }
}); 

// Retrieves all notes for the authenticated user

router.get('/',authMiddleware, async(req : AuthenticatedRequest , res : Response)=>{
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }
        const notes = await prismaClient.note.findMany({
            where : {
                userId : userId
            }
        })
        if(notes.length === 0){
            return res.status(404).json({ message: "No notes found" });
        }
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: "Internal server error from note manager" });
    }
}); 

// Retrieves a specific note by ID for the authenticated user

router.get('/:id',authMiddleware, async(req:AuthenticatedRequest,res :Response)=>{
    try {
        const {id} = req.params;
        const userId= req.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }
        const note = await prismaClient.note.findUnique({
            where: {
                id: Number(id)
            }
        });
        if(!note || note.userId !== userId){
            return res.status(404).json({ message: "Notes not found or access denied" });
        }
        res.status(200).json(note);

    } catch (error) {
        res.status(500).json({ message: "Internal server error from note manager" });
    }
} ); 

// Updates a specific note by ID for the authenticated user

router.put('/:id', authMiddleware,async(req : AuthenticatedRequest, res:Response)=>{
    try {
        const {id} = req.params;
        const userId= req.userId;
        const body = req.body;
        const parsedData = noteSchema.safeParse(body);

        if (!parsedData.success) {
            return res.status(400).json({ message: "Invalid request body", errors: parsedData.error.errors });
        }

        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        const note = await prismaClient.note.findUnique({
            where: {
                id: Number(id)
            }
        });

        if(!note || note.userId !== userId){
            return res.status(404).json({ message: "Notes not found or access denied" });
        }

        await prismaClient.note.update({
            where: { id: Number(id) },
            data: {
                title: parsedData.data.title,
                content: parsedData.data.content,
                tags:parsedData.data.tags
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error from note manager" });
    }
} ); 

// Deletes a specific note by ID for the authenticated user

router.delete('/:id', authMiddleware ,async (req:AuthenticatedRequest,res:Response)=>{
    try {
        const {id} = req.params;
        const userId= req.userId;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }
        const note = await prismaClient.note.findUnique({
            where: {
                id : Number(id)
            }
        });
        if(!note || note.userId !== userId){
            return res.status(404).json({ message: "Notes not found or access denied" });
        }
        await prismaClient.note.delete({
            where: {
                id: Number(id)
                }
        });
        res.status(200).json({ message: "Notes deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error from note manager" });
    }
} ); 

export const notesRouter = router;