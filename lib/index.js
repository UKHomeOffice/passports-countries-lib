'use strict';

const HmpoCachedModel = require('hmpo-cached-model');
const MutedCachedModel = require('./muted-cached-model');
const debug = require('debug')('hmpo:countries-cached-model');
const _ = require('underscore');

class CountriesCachedModel {
    constructor(options) {
        options = options || {};
        options.key = options.key || 'countrieslib';

        this._overseasCountries = [];
        this._residenceCountries = [];
        this._overseasResidenceCountries = [];
        this._overseasBirthCountries = [];
        this._countriesById = {};
        this._countriesBySlug = {};
        this._policiesById = {};

        let Model = options.verbose ? HmpoCachedModel : MutedCachedModel;

        this._countryCache = new Model(null, {
            url: options.countryUrl,
            store: options.store,
            key: options.key + '-countries',
            apiInterval: options.countryInterval,
            storeInterval: options.storeInterval
        });

        this._policyCache = new Model(null, {
            url: options.policyUrl,
            store: options.store,
            key: options.key + '-policy',
            apiInterval: options.policyInterval,
            storeInterval: options.storeInterval
        });

        this._countryCache.on('change', this._indexCountries.bind(this));
        this._policyCache.on('change', this._indexPolicies.bind(this));
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

    getOverseasCountries() {
        return this._overseasCountries;
    }

    getResidenceCountries() {
        return this._residenceCountries;
    }

    getOverseasResidenceCountries() {
        return this._overseasResidenceCountries;
    }

    getOverseasBirthCountries() {
        return this._overseasBirthCountries;
    }

    _indexCountries() {
        debug('indexing countries');
        let countries = this._countryCache.get('data');
        this._overseasCountries = _.filter(
            countries,
            country => country.countryCode !== 'GB'
        );
        this._residenceCountries = _.filter(
            countries,
            country => country.addressCountryFlag === true
        );
        this._overseasResidenceCountries = _.filter(
            countries,
            country => country.addressCountryFlag === true && country.countryCode !== 'GB'
        );
        this._overseasBirthCountries = _.filter(
            countries,
            country => country.countryOfBirthFlag === true && country.countryCode !== 'GB'
        );
        this._countriesById = _.indexBy(countries, 'countryCode');
        this._countriesBySlug = _.indexBy(countries, 'countryNameSlug');
    }

    _indexPolicies() {
        debug('indexing policies');
        let policies = this._policyCache.get('data');
        this._policiesById = _.indexBy(policies, 'id');
    }

    getCountryById(countryCode) {
        if (countryCode === 'UK') countryCode = 'GB';
        return  countryCode ? this._countriesById[countryCode] : null;
    }

    getCountryBySlug(countryNameSlug) {
        return countryNameSlug ? this._countriesBySlug[countryNameSlug] : null;
    }

    _getCountryData(data) {
        if (!data) return data;
        let policy = this._policiesById[data.countryCode];
        if (!policy) return null;
        delete policy['id'];
        data = _.extend(
            {},
            data,
            policy
        );
        return data;
    }

    getCountryDataById(countryCode) {
        return this._getCountryData(this.getCountryById(countryCode));
    }

    getCountryDataBySlug(countryNameSlug) {
        return this._getCountryData(this.getCountryBySlug(countryNameSlug));
    }

    isRestrictedById(id) {
        let data = this.getCountryDataById(id);
        return data && data.contentType === 7;
    }

    isActiveById(id) {
        let data = this.getCountryDataById(id);
        return data && data.status === 'ACTIVE';
    }

    getSlugById(countryCode) {
        let data = this.getCountryById(countryCode);
        return data && data.countryNameSlug;
    }
}

module.exports = CountriesCachedModel;
