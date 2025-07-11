// Sidebar.js

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/Sidebar.css";
import logo from "../assets/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
 faTachometerAlt,
 faUser,
 faMicrochip,
 faChartLine,
 faHeartbeat,
 faLightbulb,
 faCommentDots,
 faLeaf,
 faTrophy,
 faAward,
} from "@fortawesome/free-solid-svg-icons";

const Sidebar = ({ isOpen, toggleSidebar }) => {
 const sidebarRef = useRef(null);
 const userRole = localStorage.getItem('userRole');

 useEffect(() => {
  if (sidebarRef.current) {
    sidebarRef.current.style.left = isOpen ? '0' : '-280px';
  }
  document.body.style.overflow = isOpen ? 'hidden' : 'auto';
 }, [isOpen]);

 const dashboardLink = userRole === 'therapist' ? '/therapist-dashboard' : '/user-dashboard';

 return (
  <div className={`sidebar ${isOpen ? "open" : ""}`} ref={sidebarRef}>
    <div className="sidebar-header">
      <Link to="/" className="sidebar-logo">
        <img src={logo} alt="NeuroFlex Logo" className="logo-image" />
        <span>NEUROFLEX</span>
      </Link>
    </div>
    <ul className="sidebar-list">
      <li>
        <Link to={dashboardLink}>
          <FontAwesomeIcon icon={faTachometerAlt} /> Dashboard
        </Link>
      </li>
      <li>
        {/* THIS IS THE KEY CHANGE: Link "User Profile" to /profile */}
        <Link to="/profile">
          <FontAwesomeIcon icon={faUser} /> User Profile
        </Link>
      </li>
      {/* If you want a separate link for editing/managing the profile: */}
      <li>
        <Link to="/manage-profile">
          <FontAwesomeIcon icon={faUser} /> Manage Profile (Edit) {/* Or a more descriptive icon/text */}
        </Link>
      </li>
      <li>
        <Link to="/eeg-connection">
          <FontAwesomeIcon icon={faMicrochip} /> EEG Device Connection
        </Link>
      </li>
      <li>
        <Link to="/performance">
          <FontAwesomeIcon icon={faChartLine} /> Performance Overview
        </Link>
      </li>
      <li>
        <Link to="/live-eeg">
          <FontAwesomeIcon icon={faHeartbeat} /> Live EEG Data
        </Link>
      </li>
      <li>
        <Link to="/ai-recommendations">
          <FontAwesomeIcon icon={faLightbulb} /> AI Recommendations
        </Link>
      </li>
      <li>
        <Link to="/coaching-plan">
          <FontAwesomeIcon icon={faCommentDots} /> Coaching Plan
        </Link>
      </li>
      <li>
        <Link to="/mindfulness">
          <FontAwesomeIcon icon={faLeaf} /> Mindfulness & Relaxation
        </Link>
      </li>
      <li>
        <Link to="/achievements">
          <FontAwesomeIcon icon={faTrophy} /> Achievements
        </Link>
      </li>
      <li>
        <Link to="/leaderboard">
          <FontAwesomeIcon icon={faAward} /> Leaderboard
        </Link>
      </li>
    </ul>
  </div>
 );
};

export default Sidebar;