import mongoose from "mongoose";

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
        required: true
    },
    fullname: {
        type: String,
        trim: true,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverimg: {
        type: String
    },
    watchistory: [{
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

let userModel = mongoose.model("user", userSchema);

export default userModel;

