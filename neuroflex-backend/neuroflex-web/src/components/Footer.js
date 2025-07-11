// src/components/Footer.js
import React from 'react';
import './Footer.css';
import logo from "../assets/logo.png";
import { Link } from 'react-router-dom';
import { FaQuestionCircle, FaNewspaper, FaShieldAlt, FaFileContract, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter, FaBrain } from 'react-icons/fa';

function Footer() {
  const themeGreen = '#688580'; // Your theme's green color

  return (
    <footer className="neuroflex-footer">
      <div className="footer-container">
        <div className="footer-section company-info">
          <Link to="/" className="footer-logo">
            <img src={logo} alt="NeuroFlex Logo" className="logo-image" />
            <span className="logo-text">NeuroFlex</span>
          </Link>
          <p className="company-description">Neurofeedback for enhanced well-being.</p>
        </div>

        <div className="footer-section resources">
          <h3><FaBrain className="footer-icon" style={{ color: themeGreen }} /> Explore</h3>
          <ul>
            <li><Link to="/faqs"><FaQuestionCircle className="link-icon" style={{ color: themeGreen }} /> FAQs</Link></li>
            <li><Link to="/blog"><FaNewspaper className="link-icon" style={{ color: themeGreen }} /> Blog</Link></li>
            <li><Link to="/privacy-policy"><FaShieldAlt className="link-icon" style={{ color: themeGreen }} /> Privacy</Link></li>
            <li><Link to="/terms-of-use"><FaFileContract className="link-icon" style={{ color: themeGreen }} /> Terms</Link></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h3><FaEnvelope className="footer-icon" style={{ color: themeGreen }} /> Connect</h3>
          <p><FaEnvelope className="contact-icon" style={{ color: themeGreen }} /> <a href="mailto:support@neuroflex.com">support@neuroflex.com</a></p>
          <div className="social-icons">
            <a href="https://www.facebook.com/yourpage" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: themeGreen }}><FaFacebook /></a>
            <a href="https://www.instagram.com/yourpage" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: themeGreen }}><FaInstagram /></a>
            <a href="https://twitter.com/yourpage" target="_blank" rel="noopener noreferrer" aria-label="Twitter" style={{ color: themeGreen }}><FaTwitter /></a>
          </div>
        </div>

        <div className="footer-section location full-map"> {/* Added full-map class */}
          <h3><FaMapMarkerAlt className="footer-icon" style={{ color: themeGreen }} /> Visit Us</h3>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3618.2025035482916!2d67.02731377401426!3d24.92517044266767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33f91751192b9%3A0x7d44a810d3040989!2sJinnah%20University%20For%20Women!5e0!3m2!1sen!2s!4v1744390874291!5m2!1sen!2s"
              width="100%"
              height="100%" // Make height full size of its container
              style={{ border: 0, borderRadius: '6px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="NeuroFlex Location Map"
            />
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} NeuroFlex. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;