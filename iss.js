const request = require('request');

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
// https://api.ipify.org?format=json
const fetchMyIP = function(callback) {
  // use request to fetch IP address from JSON API
  request('https://api.ipify.org?format=json', (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    const { ip } = JSON.parse(body);
    return callback(null, ip);
  });
};

// http://ipwho.is/[IP address]
const fetchCoordsByIP = (ip, callback) => {
  request(`http://ipwho.is/${ip}`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }
    if (response.statusCode !== 200) {
      callback(Error(`Fetching coordinates of ip resulted in code ${response.statusCode}`), null);
      return;
    }

    const jsonBody = JSON.parse(body);
    if (!jsonBody.latitude || !jsonBody.longitude) {
      callback(Error('Response did not contain lat and/or long.'), null);
      return;
    }
    const latLongObj = {
      latitude: jsonBody.latitude,
      longitude: jsonBody.longitude
    };

    callback(null, latLongObj);
  });
};

// The API returns a list of upcoming ISS passes for a particular location formatted as JSON.
// As input it expects a latitude/longitude pair, an altitude, and how many results to return.
// As output you get the same inputs back (for checking) and a time stamp when the API ran
//  in addition to a success or failure message and a list of passes.
// Each pass has a duration in seconds and a rise time as a unix time stamp.
// https://iss-flyover.herokuapp.com/json/?lat=YOUR_LAT_INPUT_HERE&lon=YOUR_LON_INPUT_HERE
/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords, callback) {
  request(`https://iss-flyover.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }
    if (response.statusCode !== 200) {
      callback(Error(`Fetching ISS flytimes resulted in ${response.statusCode}`), null);
      return;
    }
    const bodyObj = JSON.parse(body);

    if (bodyObj.message !== 'success') {
      callback(Error('Fetching ISS flytimes was unsuccessful.'), null);
      return;
    }

    callback(null, bodyObj.response);
  });
};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results.
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */
const nextISSTimesForMyLocation = function(callback) {
  fetchMyIP((err, ip) => {
    if (err) {
      return callback(err, null);
    }

    fetchCoordsByIP(ip, (err, coords) => {
      if (err) {
        return callback(err, null);
      }

      fetchISSFlyOverTimes(coords, (erro, response) => {
        if (err) {
          return callback(err, null);
        }

        return callback(null, response);
      });
    });
  });
};

module.exports = { fetchMyIP, fetchCoordsByIP, fetchISSFlyOverTimes, nextISSTimesForMyLocation };
