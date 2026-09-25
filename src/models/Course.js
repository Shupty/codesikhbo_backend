const { model, Schema } = require("mongoose");

const courseSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "", trim: true, maxlength: 5000 },
  published: { type: Boolean, default: false, index: true },
  instructor: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true, versionKey: false });

module.exports = { Course: model("Course", courseSchema) };
