# hmpo-countries-lib
Country data API cache and wrapper library

## Usage

```
const CountriesLib = require('hmpo-countries-lib');

let redisFactory = {
    getClient() {
        return redisInstance;
    }
}

let countriesLib = new CountriesLib({
    store: redisFactory,
    key: 'store-key-prefix',
    storeInterval: 10000, // 10 seconds
    countryUrl: 'http://example.com/api/countries',
    countryInterval: 3000000, // 5 minutes
    policyUrl: 'http://example.com/api/policies',
    policyInterval: 6000000, // 10 minutes
});

// start polling
countriesLib.start();
```

```
let allCountries = countriesLib.getAllCountries();
let residentCountries = countriesLib.getResidentCountries();
let overseasCountries = countriesLib.getOverseasCountries();
let overseasResidenceCountries = countriesLib.getOverseasResidenceCountries();
let overseasBirthCountries = countriesLib.getOverseasBirthCountries();
let birthCountries = countriesLib.getBirthCountries();
let countryData = countriesLib.getCountryDataById('GB');
let countryData = countriesLib.getCountryDataBySlug('united-kingdom');
```

```
// stop polling
countriesLib.stop();
```

