import { useState, useEffect } from "react";
import axios from "axios";

function RepaymentList() {
  const [repaymentList, setRepaymentList] = useState([]);
  const [loanList, setLoanList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRepaymentId, setSelectedRepaymentId] = useState(null);

  const [loanId, setLoanId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [description, setDescription] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch repayments
  useEffect(() => {
    axios
      .get("/api/repayments")
      .then((response) => {
        setRepaymentList(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch repayments:", error);
        setErrorMessage("Failed to load repayment records.");
      });
  }, []);

  // Fetch approved loans
  useEffect(() => {
    axios
      .get("/api/loans")
      .then((response) => {
        const approvedLoans = response.data.filter(
          (loan) =>
            loan.status &&
            loan.status.toLowerCase() === "approved"
        );

        setLoanList(approvedLoans);
      })
      .catch((error) => {
        console.error("Failed to fetch loans:", error);
      });
  }, []);

  // Loan selection
  const handleLoanChange = (e) => {
    const selectedLoanId = e.target.value;

    setLoanId(selectedLoanId);
    setSuccessMessage("");
    setErrorMessage("");

    const selectedLoan = loanList.find(
      (loan) => loan.loanId === selectedLoanId
    );

    if (selectedLoan) {
      setMemberId(selectedLoan.memberId);
      setInstallmentAmount(selectedLoan.installmentAmount);
    } else {
      setMemberId("");
      setInstallmentAmount("");
    }
  };

  // Submit repayment
  const handleSubmitRepayment = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!loanId || !memberId || !installmentAmount) {
      setErrorMessage(
        "Please select a loan before saving repayment."
      );
      return;
    }

    const newRepayment = {
      loanId,
      memberId,
      installmentAmount: Number(installmentAmount),
      paymentDate: paymentDate || Date.now(),
      description,
    };

    try {
      const response = await axios.post(
        "/api/repayments",
        newRepayment
      );

      setRepaymentList((currentList) => [
        response.data.repayment,
        ...currentList,
      ]);

      setLoanId("");
      setMemberId("");
      setInstallmentAmount("");
      setPaymentDate("");
      setDescription("");
      setShowForm(false);

      setSuccessMessage(
        `Repayment recorded successfully. ${response.data.remainingInstallments} installment(s) remaining.`
      );
    } catch (error) {
      console.error("Failed to save repayment:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to save repayment. Please try again."
      );
    }
  };

  // Open cancellation confirmation
  const openCancelModal = (id) => {
    setSelectedRepaymentId(id);
    setShowConfirmModal(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const closeCancelModal = () => {
    setShowConfirmModal(false);
    setSelectedRepaymentId(null);
  };

  // Cancel repayment instead of permanently deleting it
  const handleCancelRepayment = async () => {
    if (!selectedRepaymentId) return;

    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await axios.delete(
        `/api/repayments/${selectedRepaymentId}`
      );

      const cancelledRepayment = response.data.repayment;

      setRepaymentList((currentList) =>
        currentList.map((repayment) =>
          repayment._id === selectedRepaymentId
            ? cancelledRepayment
            : repayment
        )
      );

      closeCancelModal();
      setSuccessMessage("Repayment cancelled successfully.");
    } catch (error) {
      console.error("Failed to cancel repayment:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to cancel repayment. Please try again."
      );
    }
  };

  return (
    <>
      <section className="repayment-section">
        <div className="section-header">
          <div>
            <h2>Repayments</h2>
            <p className="repayment-subtitle">
              Manage loan installment payments
            </p>
          </div>

          <button
            className="add-repayment-btn"
            onClick={() => {
              setShowForm(!showForm);
              setSuccessMessage("");
              setErrorMessage("");
            }}
          >
            {showForm ? "Close Form" : "+ Add Repayment"}
          </button>
        </div>

        {successMessage && (
          <div className="repayment-success-message">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="repayment-error-message">
            <span>!</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Repayment Form */}
        {showForm && (
          <div className="repayment-form">
            <h3>Record Loan Repayment</h3>

            <div className="repayment-form-grid">
              <div className="repayment-input-group">
                <label>Loan ID</label>
                <select
                  value={loanId}
                  onChange={handleLoanChange}
                >
                  <option value="">
                    {loanList.length > 0
                      ? "Select Approved Loan"
                      : "No Approved Loan Available"}
                  </option>

                  {loanList.map((loan) => (
                    <option key={loan._id} value={loan.loanId}>
                      {loan.loanId} — ৳
                      {Number(loan.loanAmount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="repayment-input-group">
                <label>Member ID</label>
                <input
                  type="text"
                  value={memberId}
                  placeholder="Auto-filled after loan selection"
                  readOnly
                />
              </div>

              <div className="repayment-input-group">
                <label>Installment Amount</label>
                <input
                  type="number"
                  value={installmentAmount}
                  placeholder="Auto-filled after loan selection"
                  readOnly
                />
              </div>

              <div className="repayment-input-group">
                <label>Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="repayment-input-group full-width">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="repayment-form-actions">
              <button
                className="cancel-repayment-btn"
                onClick={() => {
                  setShowForm(false);
                  setErrorMessage("");
                }}
              >
                Cancel
              </button>

              <button
                className="submit-repayment-btn"
                onClick={handleSubmitRepayment}
              >
                Save Repayment
              </button>
            </div>
          </div>
        )}

        {/* Repayment Table */}
        <div className="repayment-table-container">
          <table className="repayment-table">
            <thead>
              <tr>
                <th>Repayment ID</th>
                <th>Loan ID</th>
                <th>Member ID</th>
                <th>Installment</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {repaymentList.length > 0 ? (
                repaymentList.map((repayment) => {
                  const isCancelled =
                    repayment.paymentStatus === "Cancelled";

                  return (
                    <tr key={repayment._id}>
                      <td className="repayment-id">
                        {repayment.repaymentId}
                      </td>

                      <td>{repayment.loanId}</td>
                      <td>{repayment.memberId}</td>

                      <td className="repayment-amount">
                        ৳
                        {Number(
                          repayment.installmentAmount
                        ).toLocaleString()}
                      </td>

                      <td>
                        {new Date(
                          repayment.paymentDate
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        <span
                          className="repayment-status"
                          style={
                            isCancelled
                              ? {
                                  color: "#b91c1c",
                                  backgroundColor: "#fee2e2",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                }
                              : undefined
                          }
                        >
                          {repayment.paymentStatus}
                        </span>
                      </td>

                      <td>{repayment.description || "—"}</td>

                      <td>
                        {!isCancelled ? (
                          <button
                            className="repayment-delete-btn"
                            onClick={() =>
                              openCancelModal(repayment._id)
                            }
                          >
                            Cancel
                          </button>
                        ) : (
                          <span
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                            }}
                          >
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="empty-repayment-message"
                  >
                    No repayment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cancellation Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="repayment-confirm-overlay"
          onClick={closeCancelModal}
        >
          <div
            className="repayment-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="repayment-delete-icon">!</div>

            <h3>Cancel Repayment?</h3>

            <p>
              Are you sure you want to cancel this repayment?
              The record will remain in the history, but its
              status will change to Cancelled.
            </p>

            <div className="repayment-confirm-actions">
              <button
                className="repayment-modal-cancel"
                onClick={closeCancelModal}
              >
                Go Back
              </button>

              <button
                className="repayment-modal-delete"
                onClick={handleCancelRepayment}
              >
                Yes, Cancel Repayment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RepaymentList;