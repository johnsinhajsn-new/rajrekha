
import { Schema, models, model } from "mongoose";

const ResultSchema = new Schema(
    {
        date: {
            type: String,
            required: true,
            immutable: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
        },

        // Fixed time slot ID from SQL timelist (1–42)
        timeSlotId: {
            type: Number,
            required: true,
            min: 1,
            max: 42,
        },

        results: {
            A: { type: String, default: "", trim: true, maxlength: 20 },
            B: { type: String, default: "", trim: true, maxlength: 20 },
            C: { type: String, default: "", trim: true, maxlength: 20 },
            D: { type: String, default: "", trim: true, maxlength: 20 },
            E: { type: String, default: "", trim: true, maxlength: 20 },
            F: { type: String, default: "", trim: true, maxlength: 20 },
            G: { type: String, default: "", trim: true, maxlength: 20 },
            H: { type: String, default: "", trim: true, maxlength: 20 },
            I: { type: String, default: "", trim: true, maxlength: 20 },
            J: { type: String, default: "", trim: true, maxlength: 20 },
        },

        status: {
            type: String,
            enum: ["PENDING", "PUBLISHED", "DRAFT"],
            default: "DRAFT",
            required: true,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        publishedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// One result per date and fixed time slot.
ResultSchema.index(
    { date: 1, timeSlotId: 1 },
    { unique: true, name: "unique_date_time_slot" }
);

const Result = models.Result || model("Result", ResultSchema);

export default Result;
