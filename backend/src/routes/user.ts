import { Router } from "express";
import { authMiddleware } from "../middleware";
import { SignInSchema , SignUpSchema } from "../types";
import { prismaClient } from "../db"
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

const router = Router();

router.post('/signup' ,async(req,res)=>{
    const body = req.body;
    const parsedData = SignUpSchema.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({message : "Incorrect Inputs"});
    }
    const userExists = await prismaClient.user.findFirst({
        where:{
            email : parsedData.data.email
        }
    })
    if(userExists){
        return res.status(403).json({message : "User already exists"});
    }

    const hashedPassword = await bcrypt.hash(parsedData.data.password , 10);
    await prismaClient.user.create({
        data:{
            email : parsedData.data.email,
            password : hashedPassword,
            name : parsedData.data.name
        }
    })
    return res.status(200).json({message : "User created successfully"});
})

router.post("/signin",async(req,res)=>{
    const body = req.body;
    const parsedData = SignInSchema.safeParse(body);
    const jwt_secret = process.env.JWT_SECRET || "";
    if (!parsedData.success) {
        return res.status(411).json({message : "Incorrect Inputs"});
    }
    const user = await prismaClient.user.findFirst({
        where:{
            email : parsedData.data.email,
        }
    })
    const decodedPassword = bcrypt.compare(parsedData.data.password , user?.password || "");
    if(!user || !decodedPassword){
        return res.status(403).json({message : "Sorry credentials are incorrect"});
    }

    const token  =  jwt.sign({
        id : user.id ,
    } , jwt_secret)
    return res.status(200).json({message : "User logged in successfully" , token : token});

})


router.get('/' , authMiddleware ,  async(req,res)=>{
    //@ts-ignore
    const  id = req.id;
    const user = await prismaClient.user.findFirst({
        where:{
            id
        },
        select:{
            name : true,
            email : true
        }
    })

    return res.json({
        user
    })
})



export const userRouter = router;
