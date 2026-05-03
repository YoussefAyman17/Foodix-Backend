const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const autoIncrement = function (schema, options) {
  const incField = options.inc_field || "categoryId";
  const counterId = options.id || "category_counter";

  // ✨ خلينا الدالة async ومسحنا كلمة next خالص
  schema.pre("save", async function () {
    // لو ده تعديل مش إضافة، بنوقف الدالة بـ return بس
    if (!this.isNew) {
      return;
    }

    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true },
    );

    this[incField] = counter.seq;
  });
};

module.exports = autoIncrement;
