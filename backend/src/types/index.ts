
import {z} from 'zod'

export const SignUpSchema = z.object({
    email : z.string().min(5),
    password : z.string().min(6),
    name : z.string().min(3)
})

export const SignInSchema = z.object({
    email : z.string(),
    password : z.string()
})
export const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(['to_do', 'in_progress', 'completed']),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.date().optional(),
});



export const goalSchema = z.object({
    title : z.string(),
    description : z.string().optional(),
    targetDate : z.date().optional(),
    progress: z.number().min(0).max(100).optional(),
})
export const noteSchema = z.object({
    title : z.string(),
    content : z.string().optional(),
    tags : z.string().optional()
})