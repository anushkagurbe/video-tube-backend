import express from "express";
import { refreshAccessTokenController, userLoginController, userLogoutController, userRegisterController } from "../controllers/usercontrollers.js";
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

export default router;
