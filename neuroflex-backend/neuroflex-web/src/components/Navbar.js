// src/components/Navbar.js
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";
import logo from "../assets/logo.png";
import Sidebar from "./Sidebar";
import { logout } from '../Auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth'; // <--- ADD THIS IMPORT

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const overlayRef = useRef(null);
  const navigate = useNavigate();

  // <--- ADD THIS LINE to reactively track auth state
  const [user, loading, error] = useAuthState(auth);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout(navigate);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <button className="menu-btn" onClick={toggleSidebar}>
            ☰
          </button>

          <Link to="/" className="logo">
            <img src={logo} alt="NeuroFlex Logo" />
            <span>NEUROFLEX</span>
          </Link>

          {/* Conditionally render based on sidebar state and auth status */}
          {!sidebarOpen && (
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/games">Games</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              {/* <--- USE THE 'user' VARIABLE FROM useAuthState HERE */}
              {user ? (
                <>
                  <li>
                    <button onClick={handleLogout} className="logout-btn">
                      Logout
                    </button>
                  </li>
                  {/* You might also want a link to their dashboard here */}
                  <li>
                    <Link to={localStorage.getItem('userRole') === 'therapist' ? '/therapist-dashboard' : '/user-dashboard'}>Dashboard</Link>
                  </li>
                </>
              ) : (
                <>
                  <li><Link to="/login">Login</Link></li>
                  <li><Link to="/signup">Sign Up</Link></li>
                </>
              )}
            </ul>
          )}

          {!sidebarOpen && (
            <Link to="/consultation" className="consultation-btn">
              {/* Free Consultation */}
            </Link>
          )}
        </div>
        <div className="navbar-underline"></div>
      </nav>

      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {sidebarOpen && <div className="overlay" ref={overlayRef} onClick={toggleSidebar}></div>}
    </>
  );
};

export default Navbar;