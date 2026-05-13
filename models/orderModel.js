const mongoose = require("mongoose");
const autoIncrement = require("../utils/autoIncrement");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
      index: true,
    },

    orderItems: [
      {
        foodItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Meal",
          required: true,
        },
        size: {
          type: String,
          required: [true, "Meal size is required"],
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
      contactPhone: {
        type: String,
        required: true,
        validate: {
          validator: function (val) {
            return /^(?:\+20|0)?1[0125]\d{8}$/.test(val);
          },
          message: "Please enter a valid Egyptian phone number",
        },
      },
      notes: { type: String, default: "" },
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
    discount: {
      type: Number,
      default: 0.0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Stripe"],
      default: "Cash",
    },
    paymentInfo: {
      sessionId: {
        type: String,
      },
      paymentIntentId: {
        type: String,
      },
      paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "failed", "refunded"],
        default: "unpaid",
      },
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
  const items = this.itemsPrice || 0;
  const delivery = this.deliveryPrice || 0;
  const discount = this.discount || 0;

  const calculatedTotal = items + delivery - discount;
  this.totalPrice = Math.max(0, calculatedTotal);
});

autoIncrement(orderSchema, {
  id: "order_counter",
  inc_field: "orderId",
  start_seq: 1000,
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
