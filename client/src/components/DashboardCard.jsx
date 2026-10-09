const cardConfig = {
  Members: {
    icon: "♙",
    number: "01",
    color: "members",
    label: "Member Management",
  },
  Loans: {
    icon: "৳",
    number: "02",
    color: "loans",
    label: "Loan Operations",
  },
  Savings: {
    icon: "◈",
    number: "03",
    color: "savings",
    label: "Savings & Deposits",
  },
  Payments: {
    icon: "⇄",
    number: "04",
    color: "payments",
    label: "Repayment Tracking",
  },
};

function DashboardCard({ title, description }) {
  const config = cardConfig[title] || {
    icon: "◇",
    number: "00",
    color: "default",
    label: "Management",
  };

  return (
    <div className={`card dashboard-module-card ${config.color}`}>
      <div className="module-card-top">
        <span className="module-card-icon">{config.icon}</span>
        <span className="module-card-number">{config.number}</span>
      </div>

      <div className="module-card-content">
        <span className="module-card-label">{config.label}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="module-card-bottom">
        <span>Management Portal</span>
        <span className="module-card-arrow">↗</span>
      </div>
    </div>
  );
}

export default DashboardCard;