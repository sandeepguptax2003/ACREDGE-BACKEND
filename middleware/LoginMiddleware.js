const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');

const isAdminDomain = (email) => email?.endsWith('@acredge.in');
const isUserDomain = (origin) => origin?.includes('acredge-web--acredge-app-252ab.asia-east1.hosted.app');

const crossDomainAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    const origin = req.headers.origin || req.get('origin');

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    const decodedToken = jwt.decode(token);
    const isAdmin = decodedToken?.email;
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (isAdmin) {
      // Admin authentication
      if (!isAdminDomain(verified.email)) {
        return res.status(403).json({ message: "Not authorized as admin." });
      }

      const tokenDoc = await admin.firestore()
        .collection('tokens')
        .doc(verified.email)
        .get();

      if (!tokenDoc.exists || tokenDoc.data().token !== token) {
        return res.status(401).json({ message: "Invalid admin token." });
      }

      req.user = { email: verified.email, role: 'admin' };
      return next();
    } else {
      // User authentication
      if (!isUserDomain(origin) && req.method !== 'GET') {
        return res.status(403).json({ message: "Operation not allowed for this domain." });
      }

      const tokenDoc = await admin.firestore()
        .collection('tokens')
        .doc(verified.phoneNumber)
        .get();

      if (!tokenDoc.exists || tokenDoc.data().token !== token) {
        return res.status(401).json({ message: "Invalid user token." });
      }

      req.user = { phoneNumber: verified.phoneNumber, role: 'user' };
      return next();
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: "Authentication failed." });
  }
};

// Updated isAuthenticated middleware that uses crossDomainAuth
const isAuthenticated = async (req, res, next) => {
  return crossDomainAuth(req, res, next);
};

module.exports = {
  isAuthenticated,
  verifyToken: isAuthenticated
};