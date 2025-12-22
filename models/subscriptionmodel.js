import mongoose from "mongoose";

let subscriptionSchema = mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

let subscriptionModel = mongoose.model("subscription",subscriptionSchema);

export default subscriptionModel;

