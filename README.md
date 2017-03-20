# hmpo-countries-lib
Country data API cache and wrapper library

## Usage

```
const CountriesLib = require('hmpo-countries-lib');

let countriesLib = new CountriesLib({
    store: redisInstance,
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
let countryData = countriesLib.getCountyDataById('UK');
let countryData = countriesLib.getCountyDataBySlug('united-kingdom');
```

```
// stop polling
countriesLib.stop();
```

