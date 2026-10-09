const mongoose = require("mongoose");
const savingsSchema = new mongoose.Schema(
  {
    savingsId: {
      type: String,
      required: true,
      unique: true,
    },

    memberId: {
      type: String,
      required: true,
    },

    transactionType: {
      type: String,
      enum: ["Deposit", "Withdrawal"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    balance: {
      type: Number,
      required: true,
      default: 0,
    },

    description: {
      type: String,
      default: "",
    },

    transactionStatus: {
      type: String,
      enum: ["Active", "Cancelled"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Savings = mongoose.model("Savings", savingsSchema);

module.exports = Savings;