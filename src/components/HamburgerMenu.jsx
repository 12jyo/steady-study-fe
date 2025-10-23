import { useState } from "react";
import { FaBars } from "react-icons/fa";
import "../styles/navbar.css";

export default function HamburgerMenu({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hamburger-menu-container">
      <button className="hamburger-btn" onClick={() => setOpen((o) => !o)}>
        <FaBars size={24} />
      </button>
      {open && <div className="hamburger-dropdown">{children}</div>}
    </div>
  );
}
