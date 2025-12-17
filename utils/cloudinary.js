import { v2 as cloudinary} from "cloudinary";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export let uploadOnCloudinary = async(localfilepath)=>{
    try
    {
        if(!localfilepath)
        {
            return null;
        }
        let response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        });
        console.log("File is uploaded on coudinary ", response.url);
        return response;
    }
    catch(error)
    {
        console.log("Failed to upload the file on cloudinary", error);
        return null;
    }
    finally
    {
        fs.unlinkSync(localfilepath);
    }

}