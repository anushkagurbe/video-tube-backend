import mongoose from "mongoose";
import jwt from "jsonwebtoken";

let userSchema = mongoose.Schema({
    username: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        lowercase: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        index: true
    },
    fullname: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverimg: {
        type: String,
        required: true
    },
    watchhistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "video"
    }],
    refreshtoken: {
        type: String
    }
},
{
    timestamps: true
});

userSchema.methods.generateAccesstoken = function () {
    return jwt.sign({
        id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)}

userSchema.methods.generateRefreshtoken = function () {
    return jwt.sign({
        id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

let userModel = mongoose.model("user", userSchema);

export default userModel;

