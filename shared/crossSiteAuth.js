// shared/crossSiteAuth.js

const jwt = require('jsonwebtoken');
const { admin, db } = require('../config/firebase');

const ADMIN_DOMAIN = 'admin-acredge-a801b.web.app';
const USER_DOMAIN = 'http://localhost:3000/';

const crossSiteAuth = {
  // Middleware to verify admin access to user routes
  verifyAdminForUserRoutes: async (req, res, next) => {
    try {
      // Check for token in cookies first, then authorization header
      const tokenFromCookie = req.cookies.token;
      const tokenFromHeader = req.headers.authorization?.startsWith('Bearer ') 
        ? req.headers.authorization.split(' ')[1] 
        : req.headers.authorization;
      
      const token = tokenFromCookie || tokenFromHeader;

      if (!token) {
        return res.status(401).json({ message: "No token provided." });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify if it's an admin token (contains email)
      if (!decoded.email || !decoded.email.endsWith('@acredge.in')) {
        return res.status(403).json({ message: "Admin access required." });
      }

      // Get origin and referer
      const origin = req.get('origin') || '';
      const referer = req.get('referer') || '';

      // Check if request is coming from admin domain
      const isFromAdminDomain = origin.includes(ADMIN_DOMAIN) || 
                               referer.includes(ADMIN_DOMAIN);
      
      if (!isFromAdminDomain) {
        return res.status(403).json({ 
          message: "Access restricted to admin domain." 
        });
      }

      // Verify token in admin's database
      const tokenDoc = await admin.firestore()
        .collection('tokens')
        .doc(decoded.email)
        .get();

      if (!tokenDoc.exists || tokenDoc.data().token !== token) {
        return res.status(401).json({ message: "Invalid token." });
      }

      req.user = { 
        email: decoded.email, 
        isAdmin: true,
        tokenSource: tokenFromCookie ? 'cookie' : 'header'
      };
      next();
    } catch (error) {
      console.error('Admin verification error:', error);
      res.status(401).json({ message: "Authentication failed." });
    }
  },

  // Middleware to verify user access to admin routes
  verifyUserForAdminRoutes: async (req, res, next) => {
    try {
      // Check for token in cookies first, then authorization header
      const tokenFromCookie = req.cookies.token;
      const tokenFromHeader = req.headers.authorization?.startsWith('Bearer ') 
        ? req.headers.authorization.split(' ')[1] 
        : req.headers.authorization;
      
      const token = tokenFromCookie || tokenFromHeader;

      if (!token) {
        return res.status(401).json({ message: "No token provided." });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify if it's a user token (contains phoneNumber)
      if (!decoded.phoneNumber) {
        return res.status(403).json({ message: "Invalid user access." });
      }

      // Get origin and referer
      const origin = req.get('origin') || '';
      const referer = req.get('referer') || '';

      // Check if request is coming from user domain
      const isFromUserDomain = origin.includes(USER_DOMAIN) || 
                              referer.includes(USER_DOMAIN);
      
      if (!isFromUserDomain) {
        return res.status(403).json({ 
          message: "Access restricted to user domain." 
        });
      }

      // Verify token in user's database
      const tokenDoc = await db
        .collection('tokens')
        .doc(decoded.phoneNumber)
        .get();

      if (!tokenDoc.exists || tokenDoc.data().token !== token) {
        return res.status(401).json({ message: "Invalid token." });
      }

      req.user = { 
        phoneNumber: decoded.phoneNumber, 
        isUser: true,
        tokenSource: tokenFromCookie ? 'cookie' : 'header'
      };
      next();
    } catch (error) {
      console.error('User verification error:', error);
      res.status(401).json({ message: "Authentication failed." });
    }
  }
};

module.exports = crossSiteAuth;