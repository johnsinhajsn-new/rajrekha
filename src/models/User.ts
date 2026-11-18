
import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        passwordHash: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: ["SUPER_ADMIN", "ADMIN"],
            default: "ADMIN",
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        lastLogin: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Allow only one Super Admin account
UserSchema.index(
    { role: 1 },
    {
        unique: true,
        partialFilterExpression: {
            role: "SUPER_ADMIN",
        },
        name: "one_super_admin_only",
    }
);

const User =
    models.User || model("User", UserSchema);

export default User;
