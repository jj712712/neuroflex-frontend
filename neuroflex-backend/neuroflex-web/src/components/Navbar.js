import React, { useState, useRef } from "react";
 import { Link } from "react-router-dom";
 import "../styles/Navbar.css";
 import logo from "../assets/logo.png";
 import Sidebar from "./Sidebar";
 import { logout } from '../Auth';
 import { auth } from '../firebaseConfig';
 import { useNavigate } from 'react-router-dom'; // Import useNavigate

 const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const overlayRef = useRef(null);
  const navigate = useNavigate();

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
      {/* Hamburger Menu */}
      <button className="menu-btn" onClick={toggleSidebar}>
       ☰
      </button>

      {/* Logo (will be visible even when sidebar is open) */}
      <Link to="/" className="logo">
       <img src={logo} alt="NeuroFlex Logo" />
       <span>NEUROFLEX</span>
      </Link>

      {/* Conditionally render the nav links and auth buttons based on sidebar state and auth status */}
      {!sidebarOpen && (
       <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/how-it-works">How It Works</Link></li>
        <li><Link to="/services">Services</Link></li>
        <li><Link to="/games">Games</Link></li>
        <li><Link to="/blog">Blog</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        {auth.currentUser ? (
         <>
          <li>
           <button onClick={handleLogout} className="logout-btn">
            Logout
           </button>
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

      {/* Conditionally render the consultation button */}
      {!sidebarOpen && (
       <Link to="/consultation" className="consultation-btn">
        {/* Free Consultation */}
       </Link>
      )}
     </div>
     <div className="navbar-underline"></div>
    </nav>

    {/* Render the Sidebar */}
    <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

    {/* Conditionally render the overlay */}
    {sidebarOpen && <div className="overlay" ref={overlayRef} onClick={toggleSidebar}></div>}
   </>
  );
 };

 export default Navbar;