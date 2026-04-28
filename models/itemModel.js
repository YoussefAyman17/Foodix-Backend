const mongoose = require("mongoose");
const slugify = require("slugify");
const AutoIncrement = require("../utils/autoIncrement");

const itemSchema = new mongoose.Schema(
    {
        itemId: {
            type: Number,
            unique: true,
            index: true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category is required"],
            index: true
        },
        name: {
            type: String,
            required: [true, "Item name is required"],
            trim: true,
            index: true
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
                message: "Old price must be greater than or equal to price"
            }
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"]
        },
        rating: {
            type: Number,
            min: [0, "Minimum rating is 0"],
            max: [5, "Maximum rating is 5"],
            default: null,
        },
        discount_tag: {
            type: String,
            default: null,
        },
        short_description: {
            type: String,
            maxLength: 150,
            default: ""
        },
        description: {
            type: String,
            maxLength: 1000,
            default: ""
        },
        img: {
            type: String,
            maxLength: 255,
            default: ""

        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        sizes: [{
            size: {
                type: String,
                enum: ["S", "M", "L", "XL", "Single", "Family"]
            },
            extraPrice: {
                type: Number,
                default: 0
            }
        }],
        quantity: {
            type: Number,
            default: 0,
            min: [0, "Quantity cannot be less than zero"]
        },
        slug: {
            type: String,
            unique: false,
            lowercase: true,
            trim: true,
            index: true
        }
    },

    { timestamps: true }
);

itemSchema.index({ name: 1, category: 1 }, { unique: true });
itemSchema.pre("validate", function () {
    if (this.name) { this.slug = slugify(this.name, { lower: true, strict: true }); }
});

if (!mongoose.models.Item) {
    itemSchema.plugin(AutoIncrement, { id: "item_counter", inc_field: "itemId", parallel_hooks: false });
}

module.exports = mongoose.models.Item || mongoose.model("Item", itemSchema);