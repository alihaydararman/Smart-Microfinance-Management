import { useState, useEffect } from "react";
import axios from "axios";

function SavingsList() {
  const [savingsList, setSavingsList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSavingsId, setSelectedSavingsId] = useState(null);
  const [memberId, setMemberId] = useState("");
  const [transactionType, setTransactionType] = useState("Deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchSavings = async () => {
    try {
      const response = await axios.get("/api/savings");
      setSavingsList(response.data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load savings transactions.");
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  // Cancelled transactions are excluded from financial totals.
  const activeSavings = savingsList.filter(
    (saving) => saving.transactionStatus !== "Cancelled"
  );

  const totalDeposits = activeSavings
    .filter((saving) => saving.transactionType === "Deposit")
    .reduce((total, saving) => total + Number(saving.amount), 0);

  const totalWithdrawals = activeSavings
    .filter((saving) => saving.transactionType === "Withdrawal")
    .reduce((total, saving) => total + Number(saving.amount), 0);

  const currentBalance = totalDeposits - totalWithdrawals;

  const handleSubmitSavings = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!memberId.trim() || amount === "" || Number(amount) <= 0) {
      setErrorMessage("Enter a valid Member ID and amount.");
      return;
    }

    try {
      const response = await axios.post("/api/savings", {
        memberId: memberId.trim(),
        transactionType,
        amount: Number(amount),
        description,
      });

      setSavingsList((currentList) => [
        response.data,
        ...currentList,
      ]);

      setMemberId("");
      setTransactionType("Deposit");
      setAmount("");
      setDescription("");
      setShowForm(false);
      setSuccessMessage("Savings transaction added successfully.");

      await fetchSavings();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to save the transaction."
      );
    }
  };

  const openCancelModal = (id) => {
    setSelectedSavingsId(id);
    setShowConfirmModal(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const closeCancelModal = () => {
    setShowConfirmModal(false);
    setSelectedSavingsId(null);
  };

  const handleCancelSavings = async () => {
    if (!selectedSavingsId) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.delete(
        `/api/savings/${selectedSavingsId}`
      );

      const updatedSavings = response.data.savings;

      setSavingsList((currentList) =>
        currentList.map((saving) =>
          saving._id === selectedSavingsId
            ? updatedSavings
            : saving
        )
      );

      closeCancelModal();
      setSuccessMessage("Transaction cancelled successfully.");

      await fetchSavings();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to cancel the transaction."
      );
    }
  };

  return (
    <>
      <section className="savings-section">
        <div className="savings-header">
          <div>
            <h2>Savings Management</h2>
            <p className="savings-subtitle">
              Manage member savings and financial transactions
            </p>
          </div>

          <button
            className="add-savings-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Close Form" : "+ Add Transaction"}
          </button>
        </div>

        {errorMessage && (
          <p role="alert" style={{ color: "red", margin: "12px 0" }}>
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p role="status" style={{ color: "green", margin: "12px 0" }}>
            {successMessage}
          </p>
        )}

        <div className="savings-summary">
          <div className="savings-summary-card">
            <div className="savings-summary-icon balance-icon">৳</div>
            <div>
              <p>Current Balance</p>
              <h3>৳{currentBalance.toLocaleString()}</h3>
            </div>
          </div>

          <div className="savings-summary-card">
            <div className="savings-summary-icon deposit-icon">↓</div>
            <div>
              <p>Total Deposits</p>
              <h3>৳{totalDeposits.toLocaleString()}</h3>
            </div>
          </div>

          <div className="savings-summary-card">
            <div className="savings-summary-icon withdrawal-icon">↑</div>
            <div>
              <p>Total Withdrawals</p>
              <h3>৳{totalWithdrawals.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="savings-form">
            <div className="savings-form-header">
              <div>
                <h3>New Savings Transaction</h3>
                <p>Add a deposit or withdrawal transaction</p>
              </div>
            </div>

            <div className="savings-form-grid">
              <div className="savings-input-group">
                <label>Member ID</label>
                <input
                  type="text"
                  placeholder="e.g. M004"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />
              </div>

              <div className="savings-input-group">
                <label>Transaction Type</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                </select>
              </div>

              <div className="savings-input-group">
                <label>Amount</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="savings-input-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="savings-form-actions">
              <button
                className="cancel-savings-btn"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>

              <button
                className="submit-savings-btn"
                onClick={handleSubmitSavings}
              >
                Save Transaction
              </button>
            </div>
          </div>
        )}

        <div className="savings-transactions-header">
          <div>
            <h3>Transaction History</h3>
            <p>Recent savings transactions</p>
          </div>

          <span className="transaction-count">
            {savingsList.length} Transactions
          </span>
        </div>

        <div className="savings-table-container">
          <table className="savings-table">
            <thead>
              <tr>
                <th>Savings ID</th>
                <th>Member ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {savingsList.length > 0 ? (
                savingsList.map((saving) => {
                  const isCancelled =
                    saving.transactionStatus === "Cancelled";

                  return (
                    <tr
                      key={saving._id}
                      style={
                        isCancelled
                          ? { opacity: 0.65 }
                          : undefined
                      }
                    >
                      <td className="savings-id">
                        {saving.savingsId}
                      </td>

                      <td>
                        <span className="member-id-badge">
                          {saving.memberId}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`savings-type ${
                            saving.transactionType === "Deposit"
                              ? "deposit-type"
                              : "withdrawal-type"
                          }`}
                        >
                          {saving.transactionType}
                        </span>
                      </td>

                      <td
                        className={`savings-amount ${
                          saving.transactionType === "Deposit"
                            ? "deposit-amount"
                            : "withdrawal-amount"
                        }`}
                      >
                        {saving.transactionType === "Deposit"
                          ? "+"
                          : "-"}
                        ৳{Number(saving.amount).toLocaleString()}
                      </td>

                      <td className="savings-balance">
                        ৳{Number(saving.balance).toLocaleString()}
                      </td>

                      <td className="savings-description">
                        {saving.description || "—"}
                      </td>

                      <td>
                        <span>
                          {isCancelled ? "Cancelled" : "Active"}
                        </span>
                      </td>

                      <td>
                        {isCancelled ? (
                          <span>No action</span>
                        ) : (
                          <button
                            className="savings-delete-btn"
                            onClick={() => openCancelModal(saving._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="empty-savings-message">
                    No savings transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showConfirmModal && (
        <div
          className="savings-confirm-overlay"
          onClick={closeCancelModal}
        >
          <div
            className="savings-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="savings-delete-icon">!</div>

            <h3>Cancel Transaction?</h3>

            <p>
              Are you sure you want to cancel this transaction?
              The record will remain in the transaction history.
            </p>

            <div className="savings-confirm-actions">
              <button
                className="savings-modal-cancel"
                onClick={closeCancelModal}
              >
                Go Back
              </button>

              <button
                className="savings-modal-delete"
                onClick={handleCancelSavings}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SavingsList;