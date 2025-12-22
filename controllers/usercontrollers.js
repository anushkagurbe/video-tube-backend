import userModel from "../models/usermodel.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import subscriptionModel from "../models/subscriptionmodel.js";
import mongoose from "mongoose";
import videoModel from "../models/videomodel.js";


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

export let updatePasswordController = async(req,res)=>{
  try
  {
    let { oldPassword, newPassword, userid } = req.body;
    if(!oldPassword || !newPassword || !userid)
    {
      return res.status(400).json({success: false, msg: "All fields are password"});
    }
    if(userid.toString() !== req.user._id.toString())
    {
      return res.status(401).json({success: false, msg: "Unauthorized user"});
    }
    let user = await userModel.findOne({_id: userid});
    let isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if(!isOldPasswordValid)
    {
      return res.status(400).json({success: false, msg: "Invalid old password"});
    }
    let hashedpassword = await bcrypt.hash(newPassword, 10);
    await userModel.updateOne({_id: userid}, {$set: {password: hashedpassword}});
    return res.status(200).json({success: true, msg: "Password updated successfully"});
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({success: false, msg: "Server error "+error});
  }
}


export let updateUserDetailsController = async(req,res)=>{
  try
  {
    let { newUsername, newFullname, userid } = req.body;
    if(!username || !fullname)
    {
      return res.status(400).json({success: false, msg: "All fields are required"});
    }
    if(userid.toString() !== req.user._id.toString())
    {
      return res.status(401).json({success: false, msg: "Unauthorized user"});
    }
    let user = await userModel.findOne({_id: userid});
    await user.updateOne({_id: userid}, {$set: {username: newUsername, fullname: newFullname}});
    return res.status(200).json({success: true, msg: "User details udated successfully"});
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({success: false, msg: "Server error "+error});
  }
}


export let getUserChannelProfile = async(req,res)=>{
  try
  {   
    let loggedInUserId = req.user?._id
      ? new mongoose.Types.ObjectId(req.user._id)
      : null;
    let {channelid} = req.params;
    if(!channelid)
    {
      return res.status(400).json({success: false, msg: "Channel ID is missing"});
    }
    let channel = await userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(channelid)
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo"
        }
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers"
          },
          chanelsSubscribedToCount: {
            $size: "$subscribedTo"
          },
          isSubscribed: {
          $cond: {
            if: {
              $and: [
                { $ne: [loggedInUserId, null] },
                { $in: [loggedInUserId, "$subscribers.subscriber"] }
              ]
            },
            then: true,
            else: false
          }
        },
        } 
      },
      {
        $project: {
          username: 1,
          email: 1,
          avatar: 1,
          coverimg: 1,
          subscribersCount: 1,
          chanelsSubscribedToCount: 1,
          fullname: 1,
          isSubscribed: 1
        }
      }
    ]);

    console.log(channel)

    if(!channel?.length)
    {
      return res.status(404).json({success: false, msg: "Channel does not exist"});
    }
    return res.status(200).json({success: true, msg: channel[0]});
  }
  catch(error)
  {
    console.error(error);
    return res.status(500).json({success: false, msg: "Server error "+error});
  }
}


export let addSubscriptionController = async (req,res)=>{
  try
  {
    let {channelid} = req.body;
    if(!channelid)
    {
      return res.status(400).json({success: false, msg: "Channel ID is missing"});
    }
    let isSubscribed = await subscriptionModel.findOne({$and: [{channel: channelid},{subscriber: req.user._id}]});
    if(isSubscribed)
    {
      return res.status(400).json({success: false, msg: "You have already subscribed to this channel"});
    }
    let subscribed = await subscriptionModel.create({channel: channelid, subscriber: req.user._id});
    return res.status(200).json({success: true, msg: "Subscribed", subscribed}); 
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({success: false, msg: "Server error "+error});
  }
}


const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};


export let addVideoController = async (req,res)=>{
  try
  {
    let { title, description } = req.body;
    if(!title || !description)
    {
      return res.status(400).json({ success: false, msg: "Title or description is missing" });
    }
    let thumbnailLocalPath = req.files?.thumbnail?.[0].path;
    let videoLocalPath = req.files?.video?.[0].path;
    if(!thumbnailLocalPath || !videoLocalPath)
    {
      return res.status(400).json({ success: false, msg: "Thumbnail or video is missing" });
    }
    let thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    let video = await uploadOnCloudinary(videoLocalPath);
    if(!thumbnail || !video)
    {
      return res.status(400).json({ success: false, msg: "Upload failed" });
    }
    console.log(thumbnail);
    console.log(video.duration)
    console.log(video);
    let videodata = await videoModel.create({
      owner: req.user._id,
      title: title,
      description: description,
      video: video.url,
      thumbnail: thumbnail.url,
      duration: formatDuration(video.duration) 
    })
    if(videodata)
    {
      console.log("Video uploaded successfullly")
      return res.status(201).json({ success: true, msg: "Video uploaded successfullly", videodata: videodata });
    }
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({success: false, msg: "Server error "+error});
  }
}



export let getChannelvideosController = async(req,res)=>{
  try
  {
    let { channelid } = req.params;
    if(!channelid)
    {
      return res.status(400).json({ success: false, msg: "Invalid channel ID" });
    }
    let videos = await videoModel.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(channelid),
          isPublished: true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "channel"
        }
      },
      {
        $unwind: "$channel"
      },
      {
        $project: {
          title: 1,
          description: 1,
          video: 1,
          thumbnail: 1,
          views: 1,
          duration: 1,
          "channel.username": 1,
          "channel.avatar": 1
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    ])

    console.log(videos);
    if(!videos)
    {
      return res.status(404).json({ success: false, msg: "Videos not found" });
    }
    return res.status(200).json({ success: true, msg: "videos fetched successfully", videos: videos });
  }
  catch(error)
  {
    return res.status(500).json({ success: false, msg: "Server error "+error });
  }
}

export let getWatchHistoryController = async(req,res)=>{
  try
  {
    let userid = req.user?._id;
    let watchhistory = await userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userid)
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchhistory",
          foreignField: "_id",
          as: "watchhistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      avatar: 1,
                      fullname: 1
                    }
                  }
                ]
              }
            },
            {
              $unwind: "$owner"
            }
          ]
        }
      }
    ])
    console.log(watchhistory);
    return res.status(200).json({success: true, msg: watchhistory[0].watchhistory});
  }
  catch(error)
  {
    return res.status(500).json({ success: false, msg: "Server error "+error });
  }
}



export let updateWatchHistory = async(req,res)=>{
  try
  {
    let { videoid } = req.body;
    if(!videoid)
    {
      return res.status(400).json({success: false, msg: "Video ID is required"});
    }
    await userModel.updateOne({_id: req.user._id}, {$push: {watchhistory: videoid}});
    return res.status(200).json({success: true, msg: "Watch history updated successfully"});
  }
  catch(error)
  {
    return res.status(500).json({ success: false, msg: "Server error "+error });
  }
}