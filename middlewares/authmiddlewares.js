import jwt from "jsonwebtoken";
import userModel from "../models/usermodel.js";

export let verifyJwtMiddleware = async(req, res, next)=>{
    try
    {
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!token)
        {
            return res.status(401).json({success: false, msg: "Unauthorized user"});
        }
        let decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if(!decodedToken)
        {
            return res.status(400).json({success: false, msg: "Invalid token"});
        }
        let user = await userModel.findOne({_id: decodedToken.id}).select("-password -refreshtoken");
        req.user = user;
        next();

    }
    catch(error)
    {
        return res.status(500).json({success: false, msg: "Server error "+error});
    }
}