// import dotenv from "dotenv";
// dotenv.config();
import "dotenv/config";
import express from "express";
import cors from "cors";
import dbconection from "./db/dbconnect.js";
import userroutes from "./routes/userroutes.js";
import cookieParser from "cookie-parser";

let app = express();
dbconection();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

console.log("Cloudinary ENV CHECK:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET
});


app.use("/api/v1/users",userroutes);



app.listen(process.env.PORT, ()=>{
    console.log("Server is running on port",process.env.PORT);
})