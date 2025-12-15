import mongoose from "mongoose";    

async function dbconection() 
{
    try
    {
        await mongoose.connect(process.env.DB_URL);
        console.log("Connected to database");
    }   
    catch(error)
    {
        console.log("Failed database connection", error);
        process.exit(1);
    } 
}

export default dbconection;