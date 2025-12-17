import express from "express";
import { userLoginController, userRegisterController } from "../controllers/usercontrollers.js";
import { upload } from "../middlewares/multermiddlewares.js";

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

export default router;
