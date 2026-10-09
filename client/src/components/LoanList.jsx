import { useState, useEffect } from "react";
import axios from "axios";

function LoanList() {
  const [loanList, setLoanList] = useState([]);

  const [showForm, setShowForm] = useState(false);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] =
    useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  // Loan Form
  const [memberId, setMemberId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [installmentAmount, setInstallmentAmount] =
    useState("");
  const [durationMonths, setDurationMonths] =
    useState("12");

  // ===============================
  // ADDED: Messages
  // ===============================

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ================================
  // Open Confirmation Modal
  // ================================

  const openConfirmModal = (id, action) => {
    setSelectedLoanId(id);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  // ================================
  // Close Confirmation Modal
  // ================================

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedLoanId(null);
    setConfirmAction("");
  };

  // ================================
  // Confirm Action
  // ================================

  const handleConfirmAction = () => {
    if (!selectedLoanId) {
      return;
    }

    // Approve / Reject
    if (
      confirmAction === "Approved" ||
      confirmAction === "Rejected"
    ) {
      axios
        .put(`/api/loans/${selectedLoanId}/status`, {
          status: confirmAction,
        })
        .then((response) => {
          setLoanList((currentLoans) =>
            currentLoans.map((loan) =>
              loan._id === response.data._id
                ? response.data
                : loan,
            ),
          );

          closeConfirmModal();

          setSuccessMessage(
            `Loan ${confirmAction.toLowerCase()} successfully.`
          );

          setTimeout(() => {
            setSuccessMessage("");
          }, 4000);
        })
        .catch((error) => {
          console.log(error);

          setErrorMessage(
            error.response?.data?.message ||
              "Failed to update loan status."
          );
        });

      return;
    }

    // Delete
    if (confirmAction === "Deleted") {
      axios
        .delete(`/api/loans/${selectedLoanId}`)
        .then(() => {
          setLoanList((currentLoans) =>
            currentLoans.filter(
              (loan) => loan._id !== selectedLoanId,
            ),
          );

          closeConfirmModal();

          setSuccessMessage(
            "Loan deleted successfully."
          );

          setTimeout(() => {
            setSuccessMessage("");
          }, 4000);
        })
        .catch((error) => {
          console.log(error);

          setErrorMessage(
            error.response?.data?.message ||
              "Failed to delete loan."
          );
        });
    }
  };

  // ================================
  // Submit New Loan
  // ================================

  const handleSubmitLoan = () => {
    // Clear previous messages
    setSuccessMessage("");
    setErrorMessage("");

    // ===============================
    // ADDED: Form Validation
    // ===============================

    if (!memberId.trim()) {
      setErrorMessage(
        "Please enter the Member ID."
      );

      return;
    }

    if (!loanAmount || Number(loanAmount) <= 0) {
      setErrorMessage(
        "Please enter a valid loan amount."
      );

      return;
    }

    if (
      !installmentAmount ||
      Number(installmentAmount) <= 0
    ) {
      setErrorMessage(
        "Please enter a valid installment amount."
      );

      return;
    }

    if (
      Number(installmentAmount) >
      Number(loanAmount)
    ) {
      setErrorMessage(
        "Installment amount cannot be greater than the loan amount."
      );

      return;
    }

    if (!durationMonths) {
      setErrorMessage(
        "Please select a loan duration."
      );

      return;
    }

    const newLoan = {
      loanId: `L${Date.now()}`,
      memberId: memberId.trim(),
      loanAmount: Number(loanAmount),
      installmentAmount: Number(
        installmentAmount
      ),
      durationMonths: Number(durationMonths),
      status: "Pending",
    };

    axios
      .post("/api/loans", newLoan)
      .then((response) => {
        setLoanList((currentLoans) => [
          ...currentLoans,
          response.data,
        ]);

        // Clear form
        setMemberId("");
        setLoanAmount("");
        setInstallmentAmount("");
        setDurationMonths("12");

        setShowForm(false);

        // Success message
        setSuccessMessage(
          "Loan application submitted successfully."
        );

        setTimeout(() => {
          setSuccessMessage("");
        }, 4000);
      })
      .catch((error) => {
        console.log(error);

        setErrorMessage(
          error.response?.data?.message ||
            "Failed to submit loan application."
        );
      });
  };

  // ================================
  // Get Loans
  // ================================

  useEffect(() => {
    axios
      .get("/api/loans")
      .then((response) => {
        setLoanList(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // ================================
  // Modal Content
  // ================================

  const getModalContent = () => {
    if (confirmAction === "Approved") {
      return {
        icon: "✓",
        title: "Approve Loan?",
        message:
          "Are you sure you want to approve this loan application?",
        confirmText: "Yes, Approve",
        confirmClass: "modal-approve-btn",
      };
    }

    if (confirmAction === "Rejected") {
      return {
        icon: "!",
        title: "Reject Loan?",
        message:
          "Are you sure you want to reject this loan application?",
        confirmText: "Yes, Reject",
        confirmClass: "modal-reject-btn",
      };
    }

    return {
      icon: "×",
      title: "Delete Loan?",
      message:
        "Are you sure you want to delete this loan application? This action cannot be undone.",
      confirmText: "Yes, Delete",
      confirmClass: "modal-delete-btn",
    };
  };

  const modalContent = getModalContent();

  return (
    <>
      <section className="loan-section">

        {/* ================================
            Header
        ================================= */}

        <div className="section-header">
          <div>
            <h2>Loans</h2>

            <p className="loan-subtitle">
              Manage loan applications and approvals
            </p>
          </div>

          <button
            className="apply-loan-btn"
            onClick={() => {
              setShowForm(!showForm);

              setSuccessMessage("");
              setErrorMessage("");
            }}
          >
            {showForm
              ? "Close Form"
              : "+ Apply for Loan"}
          </button>
        </div>

        {/* ===============================
            ADDED: Success Message
        =============================== */}

        {successMessage && (
          <div className="loan-success-message">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* ===============================
            ADDED: Error Message
        =============================== */}

        {errorMessage && (
          <div className="loan-error-message">
            <span>!</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================================
            Loan Form
        ================================= */}

        {showForm && (
          <div className="loan-form">

            <div className="loan-form-header">
              <div>
                <h3>Apply for New Loan</h3>

                <p>
                  Enter the required information to submit
                  a new loan application.
                </p>
              </div>
            </div>

            <div className="loan-form-grid">

              {/* Member ID */}

              <div className="loan-input-group">
                <label>Member ID</label>

                <input
                  type="text"
                  placeholder="Enter Member ID"
                  value={memberId}
                  onChange={(e) => {
                    setMemberId(e.target.value);
                    setErrorMessage("");
                  }}
                />
              </div>

              {/* Loan Amount */}

              <div className="loan-input-group">
                <label>Loan Amount</label>

                <input
                  type="number"
                  min="1"
                  placeholder="Enter loan amount"
                  value={loanAmount}
                  onChange={(e) => {
                    setLoanAmount(e.target.value);
                    setErrorMessage("");
                  }}
                />
              </div>

              {/* Installment Amount */}

              <div className="loan-input-group">
                <label>Installment Amount</label>

                <input
                  type="number"
                  min="1"
                  placeholder="Enter installment amount"
                  value={installmentAmount}
                  onChange={(e) => {
                    setInstallmentAmount(
                      e.target.value
                    );
                    setErrorMessage("");
                  }}
                />
              </div>

              {/* Loan Duration */}

              <div className="loan-input-group">
                <label>Loan Duration</label>

                <select
                  value={durationMonths}
                  onChange={(e) => {
                    setDurationMonths(
                      e.target.value
                    );
                    setErrorMessage("");
                  }}
                >
                  <option value="12">
                    1 Year
                  </option>

                  <option value="18">
                    1.5 Years
                  </option>

                  <option value="24">
                    2 Years
                  </option>

                  <option value="30">
                    2.5 Years
                  </option>

                  <option value="36">
                    3 Years
                  </option>
                </select>
              </div>

            </div>

            <div className="loan-form-actions">

              <button
                className="cancel-form-btn"
                onClick={() => {
                  setShowForm(false);
                  setErrorMessage("");
                }}
              >
                Cancel
              </button>

              <button
                className="submit-loan-btn"
                onClick={handleSubmitLoan}
              >
                Submit Application
              </button>

            </div>

          </div>
        )}

        {/* ================================
            Loan Table
        ================================= */}

        <div className="loan-table-container">

          <table className="loan-table">

            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Member ID</th>
                <th>Loan Amount</th>
                <th>Installment</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {loanList.length > 0 ? (
                loanList.map((loan) => (

                  <tr key={loan._id}>

                    <td className="loan-id">
                      {loan.loanId}
                    </td>

                    <td>
                      {loan.memberId}
                    </td>

                    <td className="loan-amount">
                      ৳
                      {Number(
                        loan.loanAmount
                      ).toLocaleString()}
                    </td>

                    <td>
                      ৳
                      {Number(
                        loan.installmentAmount
                      ).toLocaleString()}
                    </td>

                    <td>
                      {loan.durationMonths} Months
                    </td>

                    <td>
                      <span
                        className={`loan-status ${
                          loan.status === "Approved"
                            ? "status-approved"
                            : loan.status === "Rejected"
                              ? "status-rejected"
                              : "status-pending"
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>

                    <td>

                      <div className="loan-action-buttons">

                        {loan.status === "Pending" && (
                          <>
                            <button
                              className="approve-btn"
                              onClick={() =>
                                openConfirmModal(
                                  loan._id,
                                  "Approved",
                                )
                              }
                            >
                              Approve
                            </button>

                            <button
                              className="reject-btn"
                              onClick={() =>
                                openConfirmModal(
                                  loan._id,
                                  "Rejected",
                                )
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          className="delete-btn"
                          onClick={() =>
                            openConfirmModal(
                              loan._id,
                              "Deleted",
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))
              ) : (
                <tr>

                  <td
                    colSpan="7"
                    className="empty-loan-message"
                  >
                    No loan applications found.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ================================
          Modern Confirmation Modal
      ================================= */}

      {showConfirmModal && (
        <div
          className="loan-confirm-overlay"
          onClick={closeConfirmModal}
        >

          <div
            className="loan-confirm-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div
              className={`confirm-icon ${
                confirmAction === "Approved"
                  ? "confirm-icon-approve"
                  : confirmAction === "Rejected"
                    ? "confirm-icon-reject"
                    : "confirm-icon-delete"
              }`}
            >
              {modalContent.icon}
            </div>

            <h3>
              {modalContent.title}
            </h3>

            <p>
              {modalContent.message}
            </p>

            <div className="confirm-modal-actions">

              <button
                className="modal-cancel-btn"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>

              <button
                className={
                  modalContent.confirmClass
                }
                onClick={handleConfirmAction}
              >
                {modalContent.confirmText}
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default LoanList;