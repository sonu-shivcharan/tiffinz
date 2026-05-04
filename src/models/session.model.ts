import mongoose, { model, models, Schema } from "mongoose";

interface ISession {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  refreshToken: string;
  verifyEmailToken?: string;
  verifyEmailTokenExpiry?: Date;
  forgetPasswordToken?: string;
  forgetPasswordTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const sessionScehma = new Schema<ISession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshToken: {
      type: String,
      unique: true,
    },
    verifyEmailToken: {
      type: String,
    },
    verifyEmailTokenExpiry: {
      type: Date,
    },
    forgetPasswordToken: {
      type: String,
    },
    forgetPasswordTokenExpiry: {
      type: Date,
    },
  },
  { timestamps: true },
);

sessionScehma.index({ user: 1, refreshToken: 1 });
const Session = models?.Session || model<ISession>("Session", sessionScehma);

export type { ISession };
export default Session;
