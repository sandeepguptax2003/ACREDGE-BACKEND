const jwt = require('jsonwebtoken');
const { admin, db } = require('../config/firebase');

class CrossSiteAuth {
  static async verifyAdminAccess(req, res, next) {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify if it's an admin token (contains email)
      if (!decoded.email || !decoded.email.endsWith('@acredge.in')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Verify token in admin's token collection
      const tokenDoc = await admin.firestore()
        .collection('tokens')
        .doc(decoded.email)
        .get();

      if (!tokenDoc.exists || tokenDoc.data().token !== token) {
        return res.status(401).json({ message: "Invalid admin token" });
      }

      req.adminUser = { email: decoded.email };
      next();
    } catch (error) {
      console.error('Admin verification error:', error);
      res.status(401).json({ message: "Admin authentication failed" });
    }
  }

  static async verifyUserAccess(req, res, next) {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify if it's a user token (contains phoneNumber)
      if (!decoded.phoneNumber) {
        return res.status(403).json({ message: "User access required" });
      }

      // Verify token in user's token collection
      const tokenDoc = await db
        .collection('tokens')
        .doc(decoded.phoneNumber)
        .get();

      if (!tokenDoc.exists || tokenDoc.data().token !== token) {
        return res.status(401).json({ message: "Invalid user token" });
      }

      req.user = { phoneNumber: decoded.phoneNumber };
      next();
    } catch (error) {
      console.error('User verification error:', error);
      res.status(401).json({ message: "User authentication failed" });
    }
  }

  static async verifyDomainAccess(req, res, next) {
    const allowedDomains = [
      'acredge-web--acredge-app-252ab.asia-east1.hosted.app',
      'acredge.in',
      'localhost',
      '127.0.0.1'
    ];
    
    const origin = req.get('origin') || req.get('host');
    
    if (!origin) {
      return res.status(403).json({ message: "Origin not provided" });
    }

    const domain = origin.replace(/^https?:\/\//, '').split(':')[0];
    const isAllowedDomain = allowedDomains.some(allowed => domain.includes(allowed));

    if (!isAllowedDomain) {
      console.log('Access denied for domain:', domain);
      return res.status(403).json({ message: "Access denied for this domain" });
    }

    next();
  }
}

module.exports = CrossSiteAuth;