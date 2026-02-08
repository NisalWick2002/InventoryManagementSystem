import mongoose, { Schema, Document, Model } from 'mongoose';

export type Role = 'OWNER' | 'EMPLOYEE' | 'WHOLESALER';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName?: string;
  role: Role;
  wholesalerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: String,
    role: { type: String, enum: ['OWNER', 'EMPLOYEE', 'WHOLESALER'], required: true },
    wholesalerId: { type: Schema.Types.ObjectId, ref: 'Wholesaler', default: null },
  },
  { timestamps: true }
);

// Unique indexes are already created via schema field definitions.

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
