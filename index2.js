const { nextISSTimesForMyLocation } = require('./iss_promised');

nextISSTimesForMyLocation()
  .then(flytimes => {
    const formattedFlyBys = flytimes.map(flytime => {
      const formattedDate = new Date(flytime.risetime).toString();
      return `Next pass at ${formattedDate} for ${flytime.duration} seconds`;
    });

    console.log(formattedFlyBys.join('\n'));
  })
  .catch(err => console.log(err));