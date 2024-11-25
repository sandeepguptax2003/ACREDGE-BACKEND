const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');

const crossSiteAuth = {
  
  verifyUserForAdminRoutes: async (req, res, next) => {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: "No token provided." });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
      });

      if (decoded.phoneNumber) {
        req.user = { phoneNumber: decoded.phoneNumber, isUser: true };
        return next();
      } else if (decoded.email?.endsWith('@acredge.in')) {
        // For admin tokens, verify in admin database
        const tokenDoc = await admin.firestore()
          .collection('tokens')
          .doc(decoded.email)
          .get();

        if (!tokenDoc.exists || tokenDoc.data().token !== token) {
          return res.status(401).json({ message: "Invalid admin token." });
        }

        req.user = { email: decoded.email, isAdmin: true };
        return next();
      } else {
        return res.status(403).json({ 
          message: "Invalid token format",
          details: "Token does not contain required user information"
        });
      }

    } catch (error) {
      res.status(401).json({ 
        message: "Authentication failed.",
        error: error.message
      });
    }
  }
};

module.exports = crossSiteAuth;