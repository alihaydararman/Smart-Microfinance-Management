
const navigationItems = [
  { label: "Dashboard", icon: "▦" },
  { label: "Members", icon: "♙" },
  { label: "Loans", icon: "৳" },
  { label: "Savings", icon: "◈" },
  { label: "Payments", icon: "⇄" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">SM</div>
        <div>
          <h2>Smart MF</h2>
          <p>Microfinance System</p>
        </div>
      </div>

      <div className="sidebar-label">MAIN MENU</div>

      <nav className="sidebar-nav">
        {navigationItems.map((item, index) => (
          <a
            href="#"
            key={item.label}
            className={`sidebar-link ${
              index === 0 ? "active" : ""
            }`}
            onClick={(event) => event.preventDefault()}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
            {index === 0 && (
              <span className="active-indicator" />
            )}
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-icon">✓</div>
        <div>
          <strong>Smart MF</strong>
          <p>Management Portal</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;