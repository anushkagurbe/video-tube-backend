import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import dbconection from "./db/dbconnect.js";

dotenv.config();
let app = express();
dbconection();
app.use(cors());



app.listen(process.env.PORT, ()=>{
    console.log("Server is running on port",process.env.PORT);
})