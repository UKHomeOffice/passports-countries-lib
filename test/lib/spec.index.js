'use strict';

const chai = require('chai');
chai.should();
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const CountriesCachedModel = require('../../lib');
const HmpoCachedModel = require('hmpo-cached-model');

describe('CountriesCachedModel', () => {
    let clock, instance, options, stubs;

    beforeEach(() => {
        clock = sinon.useFakeTimers(1234567890000);
        sinon.stub(HmpoCachedModel.prototype, 'start');
        sinon.stub(HmpoCachedModel.prototype, 'stop');
        sinon.stub(HmpoCachedModel.prototype, 'on');
        sinon.stub(HmpoCachedModel.prototype, 'get');

        let countryData = [
            { id: 'UK', slug: 'united-kingdom' },
            { id: 'FO', slug: 'foo' },
            { id: 'BA', slug: 'bar' },
            { id: 'NA', slug: 'narnia' }
        ];
        let policyData = [
            { id: 'UK', channel: 'ONLINE', contentType: 1 },
            { id: 'FO', channel: 'ONLINE', contentType: 2 },
            { id: 'BA', channel: 'NA', contentType: 7 },
            { id: 'NA', channel: 'ONLINE', contentType: 7 }
        ];

        stubs = {
            store: {
                get: sinon.stub(),
                set: sinon.stub().yields(null)
            },
            HmpoCachedModel: sinon.stub(),
            countryCache: {
                start: sinon.stub(),
                stop: sinon.stub(),
                on: sinon.stub(),
                get: sinon.stub().returns(countryData)
            },
            policyCache: {
                start: sinon.stub(),
                stop: sinon.stub(),
                on: sinon.stub(),
                get: sinon.stub().returns(policyData)
            }
        };

        stubs.HmpoCachedModel
            .onCall(0).returns(stubs.countryCache)
            .onCall(1).returns(stubs.policyCache);

        options = {
            countryUrl: 'http://example.com/countries',
            policyUrl: 'http://example.com/policy',
            key: 'test',
            store: stubs.store,
            storeInterval: 1000,
            countryInterval: 2000,
            policyInterval: 3000
        };

        stubs.CountriesCachedModel = proxyquire('../../lib', {
            'hmpo-cached-model': stubs.HmpoCachedModel
        });

        instance = new stubs.CountriesCachedModel(options);
    });

    afterEach(() => {
        HmpoCachedModel.prototype.start.restore();
        HmpoCachedModel.prototype.stop.restore();
        HmpoCachedModel.prototype.on.restore();
        HmpoCachedModel.prototype.get.restore();
        clock.restore();
    });

    it('should be a function', () => {
        CountriesCachedModel.should.be.a('function');
    });

    describe('constructor', () => {
        it('should use default key name if no options supplied', () => {
            stubs.HmpoCachedModel.reset();
            instance = new stubs.CountriesCachedModel();
            stubs.HmpoCachedModel.args[0][1].should.contain({
                key: 'countrieslib-countries',
            });
        });

        it('should create a country cache', () => {
            stubs.HmpoCachedModel.should.have.been.calledTwice;
            stubs.HmpoCachedModel.args[0][1].should.deep.equal({
                url: 'http://example.com/countries',
                store: stubs.store,
                key: 'test-countries',
                apiInterval: 2000,
                storeInterval: 1000
            });
            instance._countryCache.should.equal(stubs.countryCache);
        });

        it('should create a policy cache', () => {
            stubs.HmpoCachedModel.should.have.been.calledTwice;
            stubs.HmpoCachedModel.args[1][1].should.deep.equal({
                url: 'http://example.com/policy',
                store: stubs.store,
                key: 'test-policy',
                apiInterval: 3000,
                storeInterval: 1000
            });
            instance._policyCache.should.equal(stubs.policyCache);
        });

        it('should attach indexers to cache change events', () => {
            stubs.countryCache.on.should.have.been.calledOnce;
            stubs.countryCache.on.should.have.been.calledWithExactly('change', sinon.match.func);
            stubs.policyCache.on.should.have.been.calledOnce;
            stubs.policyCache.on.should.have.been.calledWithExactly('change', sinon.match.func);
        });
    });

    describe('on', () => {
        it('should be a function', () => {
            instance.on.should.be.a('function');
        });

        it('should cadd event listeners to both caches', () => {
            let handler = sinon.stub();
            instance.on('event', handler);
            stubs.countryCache.on.should.have.been.calledWithExactly('event', handler);
            stubs.policyCache.on.should.have.been.calledWithExactly('event', handler);
        });
    });

    describe('start', () => {
        it('should be a function', () => {
            instance.start.should.be.a('function');
        });

        it('should call start on both caches', () => {
            instance.start();
            stubs.countryCache.start.should.have.been.calledOnce;
            stubs.policyCache.start.should.have.been.calledOnce;
        });
    });

    describe('stop', () => {
        it('should be a function', () => {
            instance.stop.should.be.a('function');
        });

        it('should call stop on both caches', () => {
            instance.stop();
            stubs.countryCache.stop.should.have.been.calledOnce;
            stubs.policyCache.stop.should.have.been.calledOnce;
        });
    });

    describe('getAllCountries', () => {
        it('should be a function', () => {
            instance.getAllCountries.should.be.a('function');
        });

        it('should return all countries', () => {
            instance.getAllCountries().should.deep.equal([
                { id: 'UK', slug: 'united-kingdom' },
                { id: 'FO', slug: 'foo' },
                { id: 'BA', slug: 'bar' },
                { id: 'NA', slug: 'narnia' }
            ]);
        });
    });

    describe('getResidentCountries', () => {
        it('should be a function', () => {
            instance.getResidentCountries.should.be.a('function');
        });

        it('should return the value of the _residentCountries array', () => {
            instance._residentCountries = [
                { id: 'FO', slug: 'foo' }
            ];
            instance.getResidentCountries().should.deep.equal([
                { id: 'FO', slug: 'foo' }
            ]);
        });
    });

    describe('_indexCountries', () => {
        it('should be a function', () => {
            instance._indexCountries.should.be.a('function');
        });

        it('should set _residentCountries to all countries except the UK', () => {
            instance._indexCountries();
            instance._residentCountries.should.deep.equal([
                { id: 'FO', slug: 'foo' },
                { id: 'BA', slug: 'bar' },
                { id: 'NA', slug: 'narnia' }
            ]);
        });

        it('should index countries by id', () => {
            instance._indexCountries();
            instance._countriesById.should.deep.equal({
                UK: { id: 'UK', slug: 'united-kingdom' },
                FO: { id: 'FO', slug: 'foo' },
                BA: { id: 'BA', slug: 'bar' },
                NA: { id: 'NA', slug: 'narnia' }
            });
        });

        it('should index countries by slug', () => {
            instance._indexCountries();
            instance._countriesBySlug.should.deep.equal({
                'united-kingdom': { id: 'UK', slug: 'united-kingdom' },
                foo: { id: 'FO', slug: 'foo' },
                bar: { id: 'BA', slug: 'bar' },
                narnia: { id: 'NA', slug: 'narnia' }
            });
        });
    });

    describe('_indexPolicies', () => {
        it('should be a function', () => {
            instance._indexPolicies.should.be.a('function');
        });

        it('should index policies by id', () => {
            instance._indexPolicies();
            instance._policiesById.should.deep.equal({
                UK: { id: 'UK', channel: 'ONLINE', contentType: 1 },
                FO: { id: 'FO', channel: 'ONLINE', contentType: 2 },
                BA: { id: 'BA', channel: 'NA', contentType: 7 },
                NA: { id: 'NA', channel: 'ONLINE', contentType: 7 }
            });
        });
    });

    describe('getCountryById', () => {
        it('should be a function', () => {
            instance.getCountryById.should.be.a('function');
        });

        it('should get a country by its id', () => {
            instance._indexCountries();
            instance.getCountryById('UK').should.deep.equal(
                { id: 'UK', slug: 'united-kingdom' }
            );
        });

        it('should return null if no id is supplied', () => {
            instance._indexCountries();
            expect(instance.getCountryById()).to.equal(null);
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            expect(instance.getCountryById('??')).to.equal(undefined);
        });
    });

    describe('getCountryBySlug', () => {
        it('should be a function', () => {
            instance.getCountryBySlug.should.be.a('function');
        });

        it('should get a country by its slug', () => {
            instance._indexCountries();
            instance.getCountryBySlug('united-kingdom').should.deep.equal(
                { id: 'UK', slug: 'united-kingdom' }
            );
        });

        it('should return null if no slug is supplied', () => {
            instance._indexCountries();
            expect(instance.getCountryBySlug()).to.equal(null);
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            expect(instance.getCountryBySlug('not-found')).to.equal(undefined);
        });
    });

    describe('getCountryDataById', () => {
        it('should be a function', () => {
            instance.getCountryDataById.should.be.a('function');
        });

        it('should get a country and its policy data by its id', () => {
            instance._indexCountries();
            instance._indexPolicies();
            instance.getCountryDataById('UK').should.deep.equal(
                { id: 'UK', slug: 'united-kingdom', channel: 'ONLINE', contentType: 1 }
            );
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            expect(instance.getCountryDataById('??')).to.equal(undefined);
        });

        it('should return null if no policy data is found', () => {
            instance._indexCountries();
            delete instance._policiesById['UK'];
            expect(instance.getCountryDataById('UK')).to.equal(null);
        });
    });

    describe('getCountryDataBySlug', () => {
        it('should be a function', () => {
            instance.getCountryDataBySlug.should.be.a('function');
        });

        it('should get a country and its policy data by its id', () => {
            instance._indexCountries();
            instance._indexPolicies();
            instance.getCountryDataBySlug('united-kingdom').should.deep.equal({
                id: 'UK',
                slug: 'united-kingdom',
                channel: 'ONLINE',
                contentType: 1
            });
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            expect(instance.getCountryDataBySlug('??')).to.equal(undefined);
        });

        it('should return null if no policy data is found', () => {
            instance._indexCountries();
            delete instance._policiesById['UK'];
            expect(instance.getCountryDataBySlug('united-kingdom')).to.equal(null);
        });
    });
});
