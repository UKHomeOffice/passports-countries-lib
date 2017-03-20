'use strict';

const HmpoCachedModel = require('hmpo-cached-model');
const debug = require('debug')('hmpo:countries-cached-model');
const _ = require('underscore');

class CountriesCachedModel {
    constructor(options) {
        options = options || {};
        options.key = options.key || 'countrieslib';

        this._residentCountries = [];
        this._countriesById = {};
        this._countriesBySlug = {};
        this._policiesById = {};

        this._countryCache = new HmpoCachedModel(null, {
            url: options.countryUrl,
            store: options.store,
            key: options.key + '-countries',
            apiInterval: options.countryInterval,
            storeInterval: options.storeInterval
        });

        this._policyCache = new HmpoCachedModel(null, {
            url: options.policyUrl,
            store: options.store,
            key: options.key + '-policy',
            apiInterval: options.policyInterval,
            storeInterval: options.storeInterval
        });

        this.on('change', this._indexCountries.bind(this));
    }

    on(event, handler) {
        this._countryCache.on(event, handler);
        this._policyCache.on(event, handler);
    }

    start() {
        debug('start');
        this._countryCache.start();
        this._policyCache.start();
    }

    stop() {
        debug('stop');
        this._countryCache.stop();
        this._policyCache.stop();
    }

    getAllCountries() {
        return this._countryCache.get('data');
    }

    getResidentCountries() {
        return this._residentCountries;
    }

    _indexCountries() {
        debug('indexing countries');
        let countries = this._countryCache.get('data');
        this._residentCountries = _.filter(
            countries,
            country => country.id !== 'UK'
        );
        this._countriesById = _.indexBy(countries, 'id');
        this._countriesBySlug = _.indexBy(countries, 'slug');
    }

    _indexPolicies() {
        debug('indexing policies');
        let policies = this._policyCache.get('data');
        this._policiesById = _.indexBy(policies, 'id');
    }

    getCountryById(id) {
        return  id ? this._countriesById[id] : null;
    }

    getCountryBySlug(slug) {
        return slug ? this._countriesBySlug[slug] : null;
    }

    _getCountryData(data) {
        if (!data) return data;
        let policy = this._policiesById[data.id];
        if (!policy) return null;
        data = _.extend(
            {},
            data,
            policy
        );
        return data;
    }

    getCountryDataById(id) {
        return this._getCountryData(this.getCountryById(id));
    }

    getCountryDataBySlug(slug) {
        return this._getCountryData(this.getCountryBySlug(slug));
    }


}

module.exports = CountriesCachedModel;
