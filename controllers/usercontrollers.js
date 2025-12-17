import userModel from "../models/usermodel.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


let generateAccessAndRefreshToken = async(userid)=>{
  try
  {
    let user = await userModel.findOne({_id: userid});
    let accessToken = user.generateAccesstoken();
    let refreshToken = user.generateRefreshtoken();
    return {refreshToken, accessToken};
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({success: false, msg: "Error occured while creating access and refresh token. "+error});
  }
}

export let userRegisterController = async (req, res) => {
  try {
    const { username, email, fullname, password } = req.body;

    if (!username || !email || !fullname || !password) {
      return res
        .status(400)
        .json({ success: false, msg: "All fields are required" });
    }

    const isUserExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserExists) {
      return res.status(409).json({
        success: false,
        msg: "User with email or username already exists",
      });
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverimgLocalPath = req.files?.coverimg?.[0]?.path;

    if (!avatarLocalPath || !coverimgLocalPath) {
      return res.status(400).json({
        success: false,
        msg: "Avatar or cover image is missing",
      });
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverimg = await uploadOnCloudinary(coverimgLocalPath);

    if (!avatar || !coverimg) {
    return res.status(500).json({
        success: false,
        msg: "Image upload failed"
    });
}

    const hashedpassword = await bcrypt.hash(password, 10);

    let user = await userModel.create({
      username,
      email,
      password: hashedpassword,
      fullname,
      avatar: avatar.url,
      coverimg: coverimg.url,
    });

    return res.status(201).json({
      success: true,
      msg: "User registered successfully",
      user: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Server error: " + error.message,
    });
  }
};


export let userLoginController = async (req, res) => {
  try
  {
    let { email, password } = req.body;
    if(!email || !password)
    {
      return res.status(400).json({success: false, msg: "All fields are required"});
    }
    let isUserExists = await userModel.findOne({email: email});
    if(!isUserExists)
    {
      return res.status(404).json({success: false, msg: "User not found"});
    }
    let isPasswordValid = await bcrypt.compare(password, isUserExists.password);
    if(!isPasswordValid)
    {
      return res.status(401).json({success: false, msg: "Invalid password"});
    }

    let {refreshToken, accessToken} = await generateAccessAndRefreshToken(isUserExists._id);
    await userModel.updateOne({_id: isUserExists._id}, {$set: {refreshtoken: refreshToken}});
    let options = {
      httpOnly: true,
      secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken,options)
    .json({success: true, user: {
      _id: isUserExists._id,
      username: isUserExists.username,
      email: isUserExists.email,
      fullname: isUserExists.fullname,
      refreshToken: refreshToken,
      accessToken: accessToken,
      avatar: isUserExists.avatar,
      coverimg: isUserExists.coverimg
    },
    msg: "User logged in successfully"
  })
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({success: false, msg: "Server error"+error});
  }
}


export let refreshAccessTokenController = async (req, res) =>{
  try
  {
    let incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken)
    {
      return res.status(401).json({success: false, msg: "Unauthorized request"});
    }
    let decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    let user = await userModel.findOne({_id: decodedToken.id});
    if(!user || incomingRefreshToken !== user?.refreshtoken)
    {
      return res.status(401).json({success: false, msg: "Invalid refresh token "});
    }
    let { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    let options = {
      httpOnly: true,
      secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken,options)
    .json({success: true, user: {
      refreshToken: refreshToken,
      accessToken: accessToken
    },
    msg: "Token refreshed successfully"
  })
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({success: false, msg: "Server error "+error});
  }
}



export let userLogoutController = async (req, res) =>{
  try
  {
    await userModel.updateOne({ _id: req.user._id },{$set: { refreshtoken: undefined }},{ new: true });
    let options = {
      httpOnly: true,
      secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ success: true, msg: "User logged out successfully" });
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({success: false, msg: "Server error "+error});
  }
}