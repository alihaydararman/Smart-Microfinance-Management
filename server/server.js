const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Member = require("./models/Member");
const Loan = require("./models/Loan");
const Savings = require("./models/Savings");
const Repayment = require("./models/Repayment");

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// MongoDB Connection
// ===============================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");

    app.listen(5000, () => {
      console.log("Server is running on port 5000");
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed");
    console.log(error.message);
  });

// ===============================
// Home Route
// ===============================

app.get("/", (req, res) => {
  res.send("Smart Microfinance Backend is Running!");
});

// ===============================
// Member Management API
// ===============================

// Get all members
app.get("/api/members", async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch members",
      error: error.message,
    });
  }
});

// Add member
app.post("/api/members", async (req, res) => {
  try {
    const newMember = new Member(req.body);
    const savedMember = await newMember.save();

    res.status(201).json(savedMember);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to add member",
      error: error.message,
    });
  }
});

// Update member
app.put("/api/members/:id", async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update member",
      error: error.message,
    });
  }
});

// Delete member
app.delete("/api/members/:id", async (req, res) => {
  try {
    const deletedMember = await Member.findByIdAndDelete(
      req.params.id
    );

    if (!deletedMember) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    res.json({
      message: "Member deleted successfully",
      member: deletedMember,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete member",
      error: error.message,
    });
  }
});

// ===============================
// Loan Management API
// ===============================

// Get all loans
app.get("/api/loans", async (req, res) => {
  try {
    const loans = await Loan.find().sort({
      createdAt: -1,
    });

    res.json(loans);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch loans",
      error: error.message,
    });
  }
});

// Create loan
app.post("/api/loans", async (req, res) => {
  try {
    const {
      loanId,
      memberId,
      loanAmount,
      installmentAmount,
      durationMonths,
      status,
    } = req.body;

    if (
      !loanId ||
      !memberId ||
      loanAmount === undefined ||
      installmentAmount === undefined ||
      durationMonths === undefined
    ) {
      return res.status(400).json({
        message: "All required loan fields must be provided",
      });
    }

    const member = await Member.findOne({ memberId });

    if (!member) {
      return res.status(404).json({
        message: "Member not found. Please enter a valid Member ID.",
      });
    }

    const amount = Number(loanAmount);
    const installment = Number(installmentAmount);
    const duration = Number(durationMonths);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Loan amount must be greater than 0.",
      });
    }

    if (!Number.isFinite(installment) || installment <= 0) {
      return res.status(400).json({
        message: "Installment amount must be greater than 0.",
      });
    }

    if (installment > amount) {
      return res.status(400).json({
        message:
          "Installment amount cannot be greater than the loan amount.",
      });
    }

    const allowedDurations = [12, 18, 24, 30, 36];

    if (!allowedDurations.includes(duration)) {
      return res.status(400).json({
        message:
          "Loan duration must be 12, 18, 24, 30, or 36 months.",
      });
    }

    const existingLoan = await Loan.findOne({ loanId });

    if (existingLoan) {
      return res.status(400).json({
        message: "Loan ID already exists.",
      });
    }

    const newLoan = new Loan({
      loanId,
      memberId,
      loanAmount: amount,
      installmentAmount: installment,
      durationMonths: duration,
      status: status || "Pending",
    });

    const savedLoan = await newLoan.save();

    res.status(201).json(savedLoan);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to create loan",
      error: error.message,
    });
  }
});

// Update loan status
app.put("/api/loans/:id/status", async (req, res) => {
  try {
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!updatedLoan) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    res.json(updatedLoan);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update loan status",
      error: error.message,
    });
  }
});

// Delete loan
app.delete("/api/loans/:id", async (req, res) => {
  try {
    const deletedLoan = await Loan.findByIdAndDelete(
      req.params.id
    );

    if (!deletedLoan) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    res.json({
      message: "Loan deleted successfully",
      loan: deletedLoan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete loan",
      error: error.message,
    });
  }
});

// ===============================
// Savings Management API
// ===============================

// Recalculate balances for a member.
// Cancelled transactions do not affect the balance.
async function recalculateSavingsBalances(memberId) {
  const transactions = await Savings.find({ memberId }).sort({
    createdAt: 1,
    _id: 1,
  });

  let balance = 0;

  for (const transaction of transactions) {
    if (transaction.transactionStatus === "Cancelled") {
      transaction.balance = balance;
    } else {
      if (transaction.transactionType === "Deposit") {
        balance += Number(transaction.amount);
      } else if (transaction.transactionType === "Withdrawal") {
        balance -= Number(transaction.amount);
      }

      transaction.balance = balance;
    }

    await transaction.save();
  }

  return balance;
}

// Get all savings transactions, including cancelled records
app.get("/api/savings", async (req, res) => {
  try {
    const savings = await Savings.find().sort({
      createdAt: -1,
    });

    res.json(savings);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch savings",
      error: error.message,
    });
  }
});

// Create savings transaction
app.post("/api/savings", async (req, res) => {
  try {
    const {
      memberId,
      transactionType,
      amount,
      description,
    } = req.body;

    const numericAmount = Number(amount);

    if (
      !memberId ||
      !["Deposit", "Withdrawal"].includes(transactionType) ||
      amount === "" ||
      amount === undefined ||
      amount === null ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Provide a valid member, transaction type, and positive amount.",
      });
    }

    const member = await Member.findOne({ memberId });

    if (!member) {
      return res.status(404).json({
        message: "Member not found.",
      });
    }

    // Calculate the real balance from non-cancelled transactions
    const transactions = await Savings.find({ memberId });

    let currentBalance = 0;

    for (const transaction of transactions) {
      if (transaction.transactionStatus === "Cancelled") {
        continue;
      }

      if (transaction.transactionType === "Deposit") {
        currentBalance += Number(transaction.amount);
      } else if (transaction.transactionType === "Withdrawal") {
        currentBalance -= Number(transaction.amount);
      }
    }

    if (
      transactionType === "Withdrawal" &&
      numericAmount > currentBalance
    ) {
      return res.status(400).json({
        message: "Insufficient savings balance",
      });
    }

    const newSavings = new Savings({
      savingsId: "S" + Date.now(),
      memberId,
      transactionType,
      amount: numericAmount,
      balance: 0,
      description: description || "",
      transactionStatus: "Active",
    });

    await newSavings.save();

    await recalculateSavingsBalances(memberId);

    const savedSavings = await Savings.findById(newSavings._id);

    res.status(201).json(savedSavings);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to create savings transaction",
      error: error.message,
    });
  }
});

// Cancel savings transaction instead of permanently deleting it
app.delete("/api/savings/:id", async (req, res) => {
  try {
    const savings = await Savings.findById(req.params.id);

    if (!savings) {
      return res.status(404).json({
        message: "Savings transaction not found",
      });
    }

    if (savings.transactionStatus === "Cancelled") {
      return res.status(400).json({
        message: "This transaction is already cancelled.",
      });
    }

    const memberId = savings.memberId;

    savings.transactionStatus = "Cancelled";
    await savings.save();

    await recalculateSavingsBalances(memberId);

    const updatedSavings = await Savings.findById(savings._id);

    res.json({
      message: "Savings transaction cancelled successfully",
      savings: updatedSavings,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to cancel savings transaction",
      error: error.message,
    });
  }
});

// ===============================
// Repayment Management API
// ===============================

// Get all repayments, including cancelled records
app.get("/api/repayments", async (req, res) => {
  try {
    const repayments = await Repayment.find().sort({
      createdAt: -1,
    });

    res.json(repayments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch repayments",
      error: error.message,
    });
  }
});

// Create repayment
app.post("/api/repayments", async (req, res) => {
  try {
    const {
      loanId,
      memberId,
      installmentAmount,
      paymentDate,
      description,
    } = req.body;

    if (
      !loanId ||
      !memberId ||
      installmentAmount === undefined ||
      !Number.isFinite(Number(installmentAmount)) ||
      Number(installmentAmount) <= 0
    ) {
      return res.status(400).json({
        message:
          "Provide a valid loan, member, and positive installment amount.",
      });
    }

    const loan = await Loan.findOne({ loanId });

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    if (
      !loan.status ||
      loan.status.toLowerCase() !== "approved"
    ) {
      return res.status(400).json({
        message: "Repayment can only be made for an approved loan",
      });
    }

    if (loan.memberId !== memberId) {
      return res.status(400).json({
        message: "Member ID does not match this loan.",
      });
    }

    if (
      Number(installmentAmount) !==
      Number(loan.installmentAmount)
    ) {
      return res.status(400).json({
        message:
          "Installment amount must match the loan's installment amount.",
      });
    }

    const paidInstallments = await Repayment.countDocuments({
      loanId,
      paymentStatus: "Paid",
    });

    const totalInstallments = loan.durationMonths;
    const remainingInstallments =
      totalInstallments - paidInstallments;

    if (remainingInstallments <= 0) {
      return res.status(400).json({
        message:
          "All installments for this loan have already been paid",
      });
    }

    const newRepayment = new Repayment({
      repaymentId: "R" + Date.now(),
      loanId,
      memberId,
      installmentAmount: Number(installmentAmount),
      paymentDate: paymentDate || Date.now(),
      paymentStatus: "Paid",
      description: description || "",
    });

    const savedRepayment = await newRepayment.save();

    res.status(201).json({
      message: "Repayment recorded successfully",
      repayment: savedRepayment,
      remainingInstallments: remainingInstallments - 1,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to create repayment",
      error: error.message,
    });
  }
});

// Cancel repayment instead of permanently deleting it
app.delete("/api/repayments/:id", async (req, res) => {
  try {
    const repayment = await Repayment.findById(req.params.id);

    if (!repayment) {
      return res.status(404).json({
        message: "Repayment not found",
      });
    }

    if (repayment.paymentStatus === "Cancelled") {
      return res.status(400).json({
        message: "This repayment is already cancelled.",
      });
    }

    repayment.paymentStatus = "Cancelled";
    await repayment.save();

    res.json({
      message: "Repayment cancelled successfully",
      repayment,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to cancel repayment",
      error: error.message,
    });
  }
});

// ===============================
// Dashboard Statistics API
// ===============================

app.get("/api/dashboard", async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();

    const approvedLoans = await Loan.find({
      status: "Approved",
    });

    const activeLoans = approvedLoans.length;

    // Exclude cancelled savings transactions
    const savingsTransactions = await Savings.find({
      transactionStatus: { $ne: "Cancelled" },
    });

    let totalSavings = 0;

    for (const saving of savingsTransactions) {
      if (saving.transactionType === "Deposit") {
        totalSavings += Number(saving.amount);
      } else if (saving.transactionType === "Withdrawal") {
        totalSavings -= Number(saving.amount);
      }
    }

    // Count only paid repayments when calculating remaining installments
    let pendingPayments = 0;

    for (const loan of approvedLoans) {
      const totalInstallments = loan.durationMonths;

      const paidInstallments = await Repayment.countDocuments({
        loanId: loan.loanId,
        paymentStatus: "Paid",
      });

      const remainingInstallments = Math.max(
        0,
        totalInstallments - paidInstallments
      );

      pendingPayments += remainingInstallments;
    }

    res.json({
      totalMembers,
      activeLoans,
      totalSavings,
      pendingPayments,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
});