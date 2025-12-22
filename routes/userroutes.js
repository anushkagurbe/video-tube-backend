import express from "express";
import { addSubscriptionController, addVideoController, getChannelvideosController, getUserChannelProfile, getWatchHistoryController, refreshAccessTokenController, updatePasswordController, updateWatchHistory, userLoginController, userLogoutController, userRegisterController } from "../controllers/usercontrollers.js";
import { upload } from "../middlewares/multermiddlewares.js";
import { verifyJwtMiddleware } from "../middlewares/authmiddlewares.js";

let router = express.Router();

router.post("/register",upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverimg",
        maxCount: 1
    }
]),userRegisterController);
router.post("/login",userLoginController);
router.post("/logout",verifyJwtMiddleware,userLogoutController);
router.post("/refreshtoken",verifyJwtMiddleware,refreshAccessTokenController);
router.post("/updatepassword",verifyJwtMiddleware,updatePasswordController);
router.get("/getuserchannelprofile/:channelid",getUserChannelProfile);
router.post("/addvideo",verifyJwtMiddleware,upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),addVideoController);
router.get("/getchannelvideos/:channelid",getChannelvideosController);
router.get("/getwatchhistory",verifyJwtMiddleware,getWatchHistoryController);
router.put("/updatewatchhistory",verifyJwtMiddleware,updateWatchHistory);

router.post("/addsubscription",verifyJwtMiddleware,addSubscriptionController);

export default router;
