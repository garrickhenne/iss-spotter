const request = require('request-promise-native');

const fetchMyIp = () => {
  return new Promise((resolve, reject) => {
    request('https://api.ipify.org?format=json', { resolveWithFullResponse: true })
      .then(response => {
        const responseObj = JSON.parse(response.body);
        if (response.statusCode !== 200) {
          const msg = `Status Code ${response.statusCode} when fetching IP.`;
          reject(Error(msg));
          return;
        }

        resolve(responseObj.ip);
        return;
      })
      .catch(err => reject(err));
  });
};

/*
 * Makes a request to ipwho.is using the provided IP address to get its geographical information (latitude/longitude)
 * Input: JSON string containing the IP address
 * Returns: Promise of request for lat/lon
 */
const fetchCoordsByIP = function(ip) {
  return new Promise((resolve, reject) => {
    request(`http://ipwho.is/${ip}`, { resolveWithFullResponse: true })
      .then(response => {
        if (response.statusCode !== 200) {
          reject(Error(`Fetching coordinates of ip resulted in code ${response.statusCode}`));
          return;
        }

        const jsonBody = JSON.parse(response.body);
        if (!jsonBody.latitude || !jsonBody.longitude) {
          reject(Error('Response did not contain lat and/or long.'));
          return;
        }
        const latLongObj = {
          latitude: jsonBody.latitude,
          longitude: jsonBody.longitude
        };

        resolve(latLongObj);
      })
      .catch(err => reject(err));
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
 * Returns (via Promise):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords) {
  return new Promise((resolve, reject) => {
    request(`https://iss-flyover.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`, { resolveWithFullResponse: true })
      .then(response => {
        if (response.statusCode !== 200) {
          reject(Error(`Fetching ISS flytimes resulted in ${response.statusCode}`));
          return;
        }
        const bodyObj = JSON.parse(response.body);

        if (bodyObj.message !== 'success') {
          reject(Error('Fetching ISS flytimes was unsuccessful.'));
          return;
        }

        resolve(bodyObj.response);
      })
      .catch(err => reject(err));
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
const nextISSTimesForMyLocation = function() {
  return new Promise((resolve, reject) => {
    fetchMyIp()
      .then(ip => fetchCoordsByIP(ip))
      .then(coords => fetchISSFlyOverTimes(coords))
      .then(flytimes => resolve(flytimes))
      .catch(err => reject(err));
  });
};

module.exports = {
  fetchMyIp,
  fetchCoordsByIP,
  fetchISSFlyOverTimes,
  nextISSTimesForMyLocation
};