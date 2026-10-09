
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import DashboardCard from "./components/DashboardCard";
import MemberList from "./components/MemberList";
import LoanList from "./components/LoanList";
import SavingsList from "./components/SavingsList";
import RepaymentList from "./components/RepaymentList";
import Sidebar from "./components/Sidebar";
import "./App.css";

const cardData = [
  {
    title: "Members",
    description: "Manage all microfinance members",
  },
  {
    title: "Loans",
    description: "Manage loan information",
  },
  {
    title: "Savings",
    description: "Track member savings",
  },
  {
    title: "Payments",
    description: "Track loan payments",
  },
];

const initialStatistics = [
  { title: "Total Members", value: "0", icon: "♙", color: "members" },
  { title: "Active Loans", value: "0", icon: "৳", color: "loans" },
  { title: "Total Savings", value: "৳0", icon: "◈", color: "savings" },
  {
    title: "Pending Payments",
    value: "0",
    icon: "◷",
    color: "payments",
  },
];

function App() {
  const [statistics, setStatistics] = useState(initialStatistics);
  const [members, setMembers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAll, setShowAll] = useState(false);

  const today = new Date();
  const formattedToday = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Load dashboard statistics
  useEffect(() => {
    let active = true;

    axios
      .get("/api/dashboard")
      .then((response) => {
        if (!active) return;

        const data = response.data;

        setStatistics([
          {
            ...initialStatistics[0],
            value: data.totalMembers ?? 0,
          },
          {
            ...initialStatistics[1],
            value: data.activeLoans ?? 0,
          },
          {
            ...initialStatistics[2],
            value: `৳${Number(data.totalSavings ?? 0).toLocaleString("en-BD")}`,
          },
          {
            ...initialStatistics[3],
            value: data.pendingPayments ?? 0,
          },
        ]);
      })
      .catch((error) => {
        console.error("Dashboard statistics error:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  // Load members for transaction name and phone search
  useEffect(() => {
    let active = true;

    axios
      .get("/api/members")
      .then((response) => {
        if (!active) return;

        setMembers(
          Array.isArray(response.data) ? response.data : []
        );
      })
      .catch((error) => {
        console.error("Members loading error:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  // Load savings, repayments and loans
  useEffect(() => {
    let active = true;

    async function fetchTransactions() {
      setTransactionsLoading(true);
      setTransactionsError("");

      try {
        const [savingsRes, repaymentsRes, loansRes] =
          await Promise.all([
            axios.get("/api/savings"),
            axios.get("/api/repayments"),
            axios.get("/api/loans"),
          ]);

        const savings = Array.isArray(savingsRes.data)
          ? savingsRes.data
          : [];

        const repayments = Array.isArray(repaymentsRes.data)
          ? repaymentsRes.data
          : [];

        const loans = Array.isArray(loansRes.data)
          ? loansRes.data
          : [];

        const transactions = [
          ...savings.map((item) => ({
            id: `savings-${item._id}`,
            type: "Savings",
            details: item.transactionType || "Savings Transaction",
            memberId: item.memberId || "",
            amount: Number(item.amount) || 0,
            status: item.transactionStatus || "Active",
            date: item.createdAt,
          })),

          ...repayments.map((item) => ({
            id: `repayment-${item._id}`,
            type: "Repayment",
            details: "Loan Repayment",
            memberId: item.memberId || "",
            amount: Number(item.amount) || 0,
            status: item.paymentStatus || "Pending",
            date: item.createdAt,
          })),

          ...loans.map((item) => ({
            id: `loan-${item._id}`,
            type: "Loan",
            details: "Loan Application",
            memberId: item.memberId || "",
            amount: Number(item.loanAmount) || 0,
            status: item.status || item.loanStatus || "Pending",
            date: item.createdAt,
          })),
        ];

        const memberMap = new Map(
          members.map((member) => [
            String(member.memberId || "").trim().toLowerCase(),
            member,
          ])
        );

        const transactionsWithMembers = transactions.map(
          (transaction) => {
            const matchedMember = memberMap.get(
              String(transaction.memberId || "").trim().toLowerCase()
            );

            return {
              ...transaction,
              memberName: matchedMember?.name || "",
              memberPhone: matchedMember?.phone || "",
            };
          }
        );

        transactionsWithMembers.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() -
            new Date(a.date || 0).getTime()
        );

        if (active) {
          setRecentTransactions(transactionsWithMembers);
        }
      } catch (error) {
        console.error("Recent transactions error:", error);

        if (active) {
          setTransactionsError(
            "লেনদেনের তথ্য লোড করা যায়নি। Backend API পরীক্ষা করো।"
          );
        }
      } finally {
        if (active) {
          setTransactionsLoading(false);
        }
      }
    }

    fetchTransactions();

    return () => {
      active = false;
    };
  }, [members]);

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filteredTransactions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return recentTransactions.filter((transaction) => {
      const searchableText = [
        transaction.type,
        transaction.details,
        transaction.memberId,
        transaction.memberName,
        transaction.memberPhone,
        transaction.status,
        transaction.amount,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(search);

      const matchesType =
        typeFilter === "All" || transaction.type === typeFilter;

      const matchesStatus =
        statusFilter === "All" ||
        transaction.status.toLowerCase() ===
          statusFilter.toLowerCase();

      const transactionDate = transaction.date
        ? new Date(transaction.date)
        : null;

      const validDate =
        transactionDate &&
        !Number.isNaN(transactionDate.getTime());

      const matchesStart =
        !startDate ||
        (validDate &&
          transactionDate >= new Date(`${startDate}T00:00:00`));

      const matchesEnd =
        !endDate ||
        (validDate &&
          transactionDate <= new Date(`${endDate}T23:59:59.999`));

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [
    recentTransactions,
    searchTerm,
    typeFilter,
    statusFilter,
    startDate,
    endDate,
  ]);

  const displayedTransactions = showAll
    ? filteredTransactions
    : filteredTransactions.slice(0, 10);

  function resetFilters() {
    setSearchTerm("");
    setTypeFilter("All");
    setStatusFilter("All");
    setStartDate("");
    setEndDate("");
    setShowAll(false);
  }

  function exportCSV() {
    if (filteredTransactions.length === 0) {
      window.alert("Export করার জন্য কোনো transaction নেই।");
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Details",
      "Member ID",
      "Member Name",
      "Phone",
      "Amount",
      "Status",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredTransactions.map((item) => [
      formatDate(item.date),
      item.type,
      item.details,
      item.memberId,
      item.memberName,
      item.memberPhone,
      item.amount,
      item.status,
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "microfinance-transactions.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <Sidebar />

      <main className="main-content">
        {/* Dashboard Welcome Header */}
        <header className="topbar dashboard-welcome">
          <div className="welcome-copy">
            <span className="welcome-eyebrow">
              SMART MICROFINANCE MANAGEMENT
            </span>

            <h1>Welcome to your Dashboard</h1>

            <p>
              Monitor your members, loans, savings and financial activities
              from one place.
            </p>
          </div>

          <div className="welcome-date">
            <span className="welcome-date-icon">▦</span>
            <div>
              <span className="welcome-date-label">TODAY</span>
              <strong>{formattedToday}</strong>
            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="dashboard-overview">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">AT A GLANCE</span>
              <h2>Financial Overview</h2>
            </div>
            <span className="overview-live">
              <span className="overview-live-dot" />
              Dashboard Overview
            </span>
          </div>

          <div className="statistics">
            {statistics.map((stat) => (
              <div
                className={`stat-card stat-${stat.color}`}
                key={stat.title}
              >
                <div className="stat-card-top">
                  <span className="stat-card-icon">{stat.icon}</span>
                  <span className="stat-card-decoration">↗</span>
                </div>

                <h3>{stat.title}</h3>
                <h2>{stat.value}</h2>
              </div>
            ))}
          </div>
        </section>

        {/* Management Module Cards */}
        <section className="dashboard-modules">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">QUICK ACCESS</span>
              <h2>Management Modules</h2>
            </div>
            <p>Manage your daily operations</p>
          </div>

          <div className="cards">
            {cardData.map((card) => (
              <DashboardCard
                key={card.title}
                title={card.title}
                description={card.description}
              />
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="recent-transactions">
          <div className="recent-transactions-header">
            <div>
              <span className="section-eyebrow">FINANCIAL ACTIVITY</span>
              <h2>Recent Transactions</h2>
              <p className="transactions-subtitle">
                Search, filter and export financial records
              </p>
            </div>

            <button
              className="transaction-button export-button"
              onClick={exportCSV}
              disabled={
                transactionsLoading ||
                filteredTransactions.length === 0
              }
            >
              ↓ Export CSV
            </button>
          </div>

          <div className="transaction-filters">
            <input
              type="text"
              placeholder="Search name, ID, phone or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search transactions"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by transaction type"
            >
              <option value="All">All Types</option>
              <option value="Savings">Savings</option>
              <option value="Repayment">Repayments</option>
              <option value="Loan">Loans</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>

            <label className="date-filter">
              <span>From</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>

            <label className="date-filter">
              <span>To</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>

            <button
              className="transaction-button reset-button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>

          <div className="transaction-results-info">
            Showing {displayedTransactions.length} of{" "}
            {filteredTransactions.length} matching transactions
          </div>

          {transactionsLoading ? (
            <p className="transactions-message">
              Loading transactions...
            </p>
          ) : transactionsError ? (
            <p className="transactions-error">{transactionsError}</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="transactions-message">
              No matching transactions found.
            </p>
          ) : (
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Member ID</th>
                    <th>Member Name</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.type}</td>
                      <td>{transaction.details}</td>
                      <td>{transaction.memberId || "—"}</td>
                      <td>{transaction.memberName || "—"}</td>
                      <td>
                        ৳{transaction.amount.toLocaleString("en-BD")}
                      </td>
                      <td>
                        <span
                          className={`transaction-status status-${String(
                            transaction.status
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!transactionsLoading &&
            !transactionsError &&
            filteredTransactions.length > 10 && (
              <div className="view-all-container">
                <button
                  className="transaction-button view-all-button"
                  onClick={() => setShowAll((previous) => !previous)}
                >
                  {showAll
                    ? "Show Latest 10"
                    : "View All Transactions"}
                </button>
              </div>
            )}
        </section>

        {/* Existing Management Sections */}
        <section className="management-area">
          <div className="section-heading management-heading">
            <div>
              <span className="section-eyebrow">SYSTEM OPERATIONS</span>
              <h2>Manage Your Records</h2>
            </div>
            <p>Members, loans, savings and repayments</p>
          </div>

          <div className="management-section">
            <div className="management-card">
              <MemberList />
            </div>

            <div className="management-card">
              <LoanList />
            </div>

            <div className="management-card">
              <SavingsList />
            </div>

            <div className="management-card">
              <RepaymentList />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;