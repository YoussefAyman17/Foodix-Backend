const mongoose = require("mongoose");
const slugify = require("slugify");
// const autoIncrement = require("../utils/autoIncrement");
const Category = require("./categoryModel");

const mealSchema = new mongoose.Schema(
  {
    // itemId: {
    //   type: Number,
    //   unique: true,
    //   index: true,
    // },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      index: true,
    },
    on_sale: {
      type: Boolean,
      default: false,
    },
    old_price: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          if (value === null || this.price == null) return true;
          return value >= this.price;
        },
        message: "Old price must be greater than or equal to price",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    ratingsAverage: {
      type: Number,
      min: [0, "Minimum rating is 0"],
      max: [5, "Maximum rating is 5"],
      default: 0,
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    discount_tag: {
      type: String,
      default: null,
    },
    short_description: {
      type: String,
      maxLength: 150,
      default: "",
    },
    description: {
      type: String,
      maxLength: 1000,
      default: "",
    },
    img: {
      type: String,
      maxLength: 255,
      default: "",
    },
    imgCloudinaryId: {
      type: String,
      maxLength: 255,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    sizes: [
      {
        size: {
          type: String,
          enum: ["S", "M", "L", "XL", "Single", "Double", "Triple", "Family"],
        },
        extraPrice: {
          type: Number,
          default: 0,
        },
      },
    ],
    // quantity: {
    //   type: Number,
    //   default: 0,
    //   min: [0, "Quantity cannot be less than zero"],
    // },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    orders_count: {
      type: Number,
      default: 0,
    },
  },

  { timestamps: true },
);

mealSchema.index({ name: 1, category: 1 }, { unique: true });

mealSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "meal",
  localField: "_id",
});

mealSchema.pre("validate", function () {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

mealSchema.post("save", async function () {
  await Category.findByIdAndUpdate(this.category, {
    $inc: { mealsCount: 1 },
  });
});

mealSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Category.findByIdAndUpdate(doc.category, {
      $inc: { mealsCount: -1 },
    });
  }
});

mealSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  const newName = update.name || (update.$set && update.$set.name);

  if (newName) {
    const newSlug = slugify(newName, { lower: true, strict: true });
    if (update.$set) {
      update.$set.slug = newSlug;
    } else {
      update.slug = newSlug;
    }
  }
});

// autoIncrement(mealSchema, {
//   id: "item_counter",
//   inc_field: "itemId",
// });
const Meal = mongoose.model("Meal", mealSchema);

module.exports = Meal;
