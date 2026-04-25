const mongoose = require("mongoose");
const slugify = require("slugify");
const AutoIncrement = require("../utils/autoIncrement");
const categorySchema = new mongoose.Schema(
    {
        categoryId: {
            type: Number,
            unique: true,
            index: true
        },
        name: {
            type: String,
            required: [true, "Category name is required"],
            index: true,
            unique: [true, 'name must be unique'],
            trim: true,
            minLength: [3, "Name is too short, minimum is 3 characters"],
            maxLength: [15, "Name is too long, maximum is 15 characters"]
        },
        description: {
            type: String,
            default: "",
            maxLength: [200, "Description cannot exceed 200 characters"]
        },
        image: {
            type: String,
            maxLength: [255, "Image URL/path is too long, maximum is 255 characters"]
        },
        isActive: {
            type: Boolean,
            default: true
        },
        slug: {
            type: String,
            lowercase: true,
            trim: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);
categorySchema.pre("validate", function () {
    if (this.name) { this.slug = slugify(this.name, { lower: true, strict: true }); }
});

if (!mongoose.models.Category) {
    categorySchema.plugin(AutoIncrement, { id: "category_counter", inc_field: "categoryId", parallel_hooks: false });
}

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);