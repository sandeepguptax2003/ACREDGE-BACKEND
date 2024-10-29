const express = require('express');
const router = express.Router();
const { placesAutocomplete, placeDetails } = require('../middleware/GooglePlacesMiddleware');
const { isAuthenticated } = require('../controllers/LoginController');

router.get('/autocomplete', isAuthenticated, placesAutocomplete);
router.get('/details', isAuthenticated, placeDetails);

module.exports = router;