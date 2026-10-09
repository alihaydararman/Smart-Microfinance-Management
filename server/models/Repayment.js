const mongoose = require("mongoose");

const repaymentSchema = new mongoose.Schema(
  {
    repaymentId: {
      type: String,
      required: true,
      unique: true,
    },

    loanId: {
      type: String,
      required: true,
    },

    memberId: {
      type: String,
      required: true,
    },

    installmentAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Cancelled"],
      default: "Paid",
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Repayment = mongoose.model(
  "Repayment",
  repaymentSchema
);

module.exports = Repayment;