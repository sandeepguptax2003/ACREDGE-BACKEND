const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});

const placesAutocomplete = async (req, res) => {
  const { input, sessiontoken } = req.query;
  
  try {
    const response = await client.placeAutocomplete({
      params: {
        input,
        key: process.env.GOOGLE_PLACES_API_KEY,
        sessiontoken,
        components: 'country:IN',
      }
    });

    const predictions = response.data.predictions.map(prediction => ({
      description: prediction.description,
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
    }));

    res.json(predictions);
  } catch (error) {
    console.error('Error fetching place predictions:', error);
    res.status(500).json({ error: 'Failed to fetch address suggestions' });
  }
};

const placeDetails = async (req, res) => {
  const { placeId } = req.query;

  try {
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_PLACES_API_KEY,
      }
    });

    const place = response.data.result;
    const formattedAddress = {
      fullAddress: place.formatted_address,
      streetNumber: '',
      route: '',
      locality: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    };

    // Extract address components
    place.address_components.forEach(component => {
      if (component.types.includes('street_number')) {
        formattedAddress.streetNumber = component.long_name;
      }
      if (component.types.includes('route')) {
        formattedAddress.route = component.long_name;
      }
      if (component.types.includes('sublocality_level_1')) {
        formattedAddress.locality = component.long_name;
      }
      if (component.types.includes('locality')) {
        formattedAddress.city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        formattedAddress.state = component.long_name;
      }
      if (component.types.includes('country')) {
        formattedAddress.country = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        formattedAddress.postalCode = component.long_name;
      }
    });

    res.json(formattedAddress);
  } catch (error) {
    console.error('Error fetching place details:', error);
    res.status(500).json({ error: 'Failed to fetch address details' });
  }
};

module.exports = {
  placesAutocomplete,
  placeDetails
};