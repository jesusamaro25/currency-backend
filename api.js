const rest = require('restler');
const apiUrl = 'https://api.exchangeratesapi.io/';

const self = (module.exports = {
  ver001: (data, res) => {

    const { base, amount, symbol, date } = data;
    let symbols = '';
    let finalDate = '';
    let url = '';

    // validate that a base currency is supplied
    if (typeof base === 'undefined' || base === '') {
      self.sendResponse(res, 403, 'Please supply a base currency symbol');
      return;
    }

    // convert base to uppercase for consistancy
    const upperCaseBase = base.toUpperCase();

    // validate that a symbol to convert to. Eg CAD/AUD/USD
    if (typeof symbol === 'undefined' || symbol === '') {
      self.sendResponse(
        res,
        403,
        'Please supply a currency symbol to convert to'
      );
      return;
    }

    // validate that an amount is provided
    if (typeof amount === 'undefined' || amount === '') {
      self.sendResponse(res, 403, 'Please supply an amount to convert');
      return;
    }

    // build the API call URL
    url = apiUrl + 'latest?symbols=' + symbol.from + ',' + symbol.to;

    if (typeof symbol === 'object') {
      let str = '';
      const symbolArray = symbol;

      for (let i = symbolArray.length - 1; i >= 0; i--) {
        str += symbolArray[i].toUpperCase() + ',';
      }

      symbols = str;
    } else {
      symbols = symbol.toUpperCase();
    }

    if (typeof date !== 'undefined') {

      let isValidDate = Date.parse(date);

      if (typeof date !== 'string') {
        self.sendResponse(res, 403, 'Please provide the date as a string');
        return;
      }
      if (!isValidDate) {
        self.sendResponse(res, 403, 'Please provide a valid date');
        return;
      }

      finalDate = date;
    } else {
      finalDate = 'latest';
    }

    url = apiUrl + finalDate + '?base=' + upperCaseBase + '&symbols=' + symbols;

    console.log('Calling Fixer API at: ', url);

    rest.get(url, { headers: { access_key: '6FaAJiRFQDPejjASMMYFr0KXava6TN0D'}}).on('complete', (result, response) => {
      console.log('result :', result);
      if (response.statusCode == 200) {
        const returns = {
          base,
          amount,
          results: self.convertAmount(amount, result),
          dated: date,
        };

        self.sendResponse(res, 200, returns);
      }
      if (response.statusCode == 401) {
        callback('Not Authorized');
      }
      if (response.statusCode == 502) {
        callback('API Error');
      }
    });
  },

  convertAmount: (amount, data) => {

    console.log(amount, data)

    const { rates, base } = data;
    let returns = [];

    for (const r in rates) {
      if (rates.hasOwnProperty(r)) {
        const convert = amount * rates[r];
        returns.push({
          from: base,
          to: r,
          roundedResult: convert.toFixed(2),
          fullResult: convert,
          rate: rates[r],
        });
      }
    }

    return returns;
  },

  sendResponse: (res, status, response) => {
    res.status(status);
    res.json(response);
    res.end();
  },
});
