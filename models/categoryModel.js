const mongoose = require("mongoose");
const slugify = require("slugify");
const AutoIncrement = require("../utils/autoIncrement");
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      index: true,
      unique: true,
      trim: true,
      minLength: [3, "Name is too short, minimum is 3 characters"],
      maxLength: [15, "Name is too long, maximum is 15 characters"],
    },
    description: {
      type: String,
      default: "",
      maxLength: [200, "Description cannot exceed 200 characters"],
    },
    image: {
      type: String,
      maxLength: [255, "Image URL/path is too long, maximum is 255 characters"],
    },
    imgCloudinaryId: {
      type: String,
      maxLength: 255,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});
categorySchema.pre(/^(updateOne|findOneAndUpdate)/, function (next) {
  const update = this.getUpdate();
  if (update && update.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
  }
});
module.exports = mongoose.model("Category", categorySchema);
