const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
    },

    orderItems: [
      {
        foodItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Food",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity cannot be less than 1"],
        },
        priceAtPurchase: {
          type: Number,
          required: true,
        },
      },
    ],

    shippingAddress: {
      city: { type: String, required: true },
      area: { type: String, required: true },
      street: { type: String, required: true },
      building: String,
      floor: Number,
      apartment: Number,
    },

    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null,
    },

    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    deliveryPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Card"],
      default: "Cash",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Preparing", "On the way", "Delivered", "Cancelled"],
      default: "Pending",
    },

    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.pre("save", function (next) {
  this.totalPrice = this.itemsPrice + this.deliveryPrice;
  next();
});

orderSchema.plugin(AutoIncrement, { inc_field: "orderId", start_seq: 1000 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
