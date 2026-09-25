const { model, Schema } = require("mongoose");

const enrollmentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  progress: { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true, versionKey: false });

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = { Enrollment: model("Enrollment", enrollmentSchema) };
