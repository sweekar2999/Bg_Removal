import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js';


//app
const PORT=process.env.PORT||4000;
const app=express();
await connectDB();



//middlewares
app.use(cors());
app.use(express.json());


//routes
app.get('/',(req,res)=>{
    res.send("Hi")
});
app.use("/api/user",userRouter)
app.use("/api/image", imageRouter);

app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`);
})