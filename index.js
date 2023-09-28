const { fetchMyIP, fetchCoordsByIP, fetchISSFlyOverTimes, nextISSTimesForMyLocation } = require('./iss');

nextISSTimesForMyLocation((err, res) => {
  if (err) {
    console.log(err);
    return;
  }

  const formattedFlyBys = res.map(flytime => {
    const formattedDate = new Date(flytime.risetime).toString();
    return `Next pass at ${formattedDate} for ${flytime.duration} seconds`;
  });

  console.log(formattedFlyBys.join('\n'));
});