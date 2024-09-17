import express from 'express'
import cors from "cors"
import { userRouter } from './routes/user';
import { taskManager } from './routes/taskManager';
import { goalRouter } from './routes/goalManager';
import { notesRouter } from './routes/notesManager';

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/task" , taskManager);
app.use("/api/v1/goal" , goalRouter);
app.use("/api/v1/notes",notesRouter)


app.listen(3000,()=>{
    console.log("Running on port 3000");
})