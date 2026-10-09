const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      required: true,
      unique: true,
    },

  memberId: {
  type: String,
  required: true,
},

    loanAmount: {
      type: Number,
      required: true,
    },

    installmentAmount: {
      type: Number,
      required: true,
    },

    durationMonths: {
      type: Number,
      required: true,
      min: 12,
      max: 36,
    },

    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

const Loan = mongoose.model("Loan", loanSchema);

module.exports = Loan;
