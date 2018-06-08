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
            { countryCode: 'GB', countryNameSlug: 'united-kingdom', addressCountryFlag: true, countryOfBirthFlag: true },
            { countryCode: 'FO', countryNameSlug: 'foo', addressCountryFlag: true, countryOfBirthFlag: false },
            { countryCode: 'BA', countryNameSlug: 'bar', addressCountryFlag: false, countryOfBirthFlag: true },
            { countryCode: 'NA', countryNameSlug: 'narnia', addressCountryFlag: null, countryOfBirthFlag: null }
        ];
        let policyData = [
            { id: 'GB', channel: 'ONLINE', contentType: 1, status: 'ACTIVE' },
            { id: 'FO', channel: 'ONLINE', contentType: 2, status: 'INACTIVE'  },
            { id: 'BA', channel: 'NA', contentType: 7, status: 'INACTIVE'  },
            { id: 'NA', channel: 'ONLINE', contentType: 7, status: 'INACTIVE'  }
        ];

        stubs = {
            storeFactory: {
                getClient: sinon.stub()
            },
            store: {
                get: sinon.stub(),
                set: sinon.stub().yields(null)
            },
            HmpoCachedModel: sinon.stub(),
            MutedCachedModel: sinon.stub(),
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

        stubs.storeFactory.getClient.returns(stubs.store);

        stubs.HmpoCachedModel
            .onCall(0).returns(stubs.countryCache)
            .onCall(1).returns(stubs.policyCache);

        stubs.MutedCachedModel
            .onCall(0).returns(stubs.countryCache)
            .onCall(1).returns(stubs.policyCache);

        options = {
            countryUrl: 'http://example.com/countries',
            policyUrl: 'http://example.com/policy',
            key: 'test',
            store: stubs.storeFactory,
            storeInterval: 1000,
            countryInterval: 2000,
            policyInterval: 3000
        };

        stubs.CountriesCachedModel = proxyquire('../../lib', {
            'hmpo-cached-model': stubs.HmpoCachedModel,
            './muted-cached-model': stubs.MutedCachedModel
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
            stubs.MutedCachedModel.resetHistory();
            instance = new stubs.CountriesCachedModel();
            stubs.MutedCachedModel.firstCall.should.have.been.calledWithMatch(null, {
                key: 'countrieslib-countries'
            });
        });

        it('should create a country cache', () => {
            stubs.MutedCachedModel.should.have.been.calledTwice.and.calledWithNew;
            stubs.MutedCachedModel.firstCall.should.have.been.calledWithMatch(null, {
                url: 'http://example.com/countries',
                store: stubs.storeFactory,
                key: 'test-countries',
                apiInterval: 2000,
                storeInterval: 1000
            });
            instance._countryCache.should.equal(stubs.countryCache);
        });

        it('should create a policy cache', () => {
            stubs.MutedCachedModel.should.have.been.calledTwice.and.calledWithNew;
            stubs.MutedCachedModel.args[1][1].should.deep.equal({
                url: 'http://example.com/policy',
                store: stubs.storeFactory,
                key: 'test-policy',
                apiInterval: 3000,
                storeInterval: 1000
            });
            instance._policyCache.should.equal(stubs.policyCache);
        });

        it('should use a non muted cached model if verbose option is set', () => {
            stubs.HmpoCachedModel.resetHistory();
            instance = new stubs.CountriesCachedModel({ verbose: true });
            stubs.HmpoCachedModel.should.have.been.calledTwice.and.calledWithNew;
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
                { addressCountryFlag: true, countryCode: 'GB', countryNameSlug: 'united-kingdom', countryOfBirthFlag: true },
                { addressCountryFlag: true, countryCode: 'FO', countryNameSlug: 'foo', countryOfBirthFlag: false },
                { addressCountryFlag: false, countryCode: 'BA', countryNameSlug: 'bar', countryOfBirthFlag: true },
                { addressCountryFlag: null, countryCode: 'NA', countryNameSlug: 'narnia', countryOfBirthFlag: null }
            ]);
        });
    });

    describe('getOverseasCountries', () => {
        it('should be a function', () => {
            instance.getOverseasCountries.should.be.a('function');
        });

        it('should return the value of the _overseasCountries array', () => {
            instance._overseasCountries = [
                { countryCode: 'FO', countryNameSlug: 'foo' }
            ];
            instance.getOverseasCountries().should.deep.equal([
                { countryCode: 'FO', countryNameSlug: 'foo' }
            ]);
        });
    });

    describe('getResidenceCountries', () => {
        it('should be a function', () => {
            instance.getResidenceCountries.should.be.a('function');
        });

        it('should return the value of the _residenceCountries array', () => {
            instance._residenceCountries = [
                { countryCode: 'FO', countryNameSlug: 'foo' }
            ];
            instance.getResidenceCountries().should.deep.equal([
                { countryCode: 'FO', countryNameSlug: 'foo' }
            ]);
        });
    });

    describe('getOverseasResidenceCountries', () => {
        it('should be a function', () => {
            instance.getOverseasResidenceCountries.should.be.a('function');
        });

        it('should return the value of the _overseasResidenceCountries array', () => {
            instance._overseasResidenceCountries = [
                { countryCode: 'FO', countryNameSlug: 'foo' }
            ];
            instance.getOverseasResidenceCountries().should.deep.equal([
                { countryCode: 'FO', countryNameSlug: 'foo' }
            ]);
        });
    });

    describe('getOverseasBirthCountries', () => {
        it('should be a function', () => {
            instance.getOverseasBirthCountries.should.be.a('function');
        });

        it('should return the value of the _overseasBirthCountries array', () => {
            instance._overseasBirthCountries = [
                { countryCode: 'BA', countryNameSlug: 'bar' }
            ];
            instance.getOverseasBirthCountries().should.deep.equal([
                { countryCode: 'BA', countryNameSlug: 'bar' }
            ]);
        });
    });


    describe('_indexCountries', () => {
        it('should be a function', () => {
            instance._indexCountries.should.be.a('function');
        });

        it('should set _overseasCountries to all countries except GB', () => {
            instance._indexCountries();
            instance._overseasCountries.should.deep.equal([
                { addressCountryFlag: true, countryCode: 'FO', countryNameSlug: 'foo', countryOfBirthFlag: false },
                { addressCountryFlag: false, countryCode: 'BA', countryNameSlug: 'bar', countryOfBirthFlag: true },
                { addressCountryFlag: null, countryCode: 'NA', countryNameSlug: 'narnia', countryOfBirthFlag: null }
            ]);
        });

        it('should set _residenceCountries to all countries where addressCountryFlag is true', () => {
            instance._indexCountries();
            instance._residenceCountries.should.deep.equal([
                { addressCountryFlag: true, countryCode: 'GB', countryNameSlug: 'united-kingdom', countryOfBirthFlag: true },
                { addressCountryFlag: true, countryCode: 'FO', countryNameSlug: 'foo', countryOfBirthFlag: false }
            ]);
        });

        it('should set _overseasResidenceCountries to all countries where countryCode is not GB and addressCountryFlag is true', () => {
            instance._indexCountries();
            instance._overseasResidenceCountries.should.deep.equal([
                { addressCountryFlag: true, countryCode: 'FO', countryNameSlug: 'foo', countryOfBirthFlag: false }
            ]);
        });

        it('should set _overseasBirthCountries to all countries where countryCode is not GB and countryOfBirthFlag is true', () => {
            instance._indexCountries();
            instance._overseasBirthCountries.should.deep.equal([
                { addressCountryFlag: false, countryCode: 'BA', countryNameSlug: 'bar', countryOfBirthFlag: true }
            ]);
        });

        it('should index countries by id', () => {
            instance._indexCountries();
            instance._countriesById.should.deep.equal({
                GB: { addressCountryFlag: true, countryCode: 'GB', countryNameSlug: 'united-kingdom', countryOfBirthFlag: true },
                FO: { addressCountryFlag: true, countryCode: 'FO', countryNameSlug: 'foo', countryOfBirthFlag: false },
                BA: { addressCountryFlag: false, countryCode: 'BA', countryNameSlug: 'bar', countryOfBirthFlag: true },
                NA: { addressCountryFlag: null, countryCode: 'NA', countryNameSlug: 'narnia', countryOfBirthFlag: null }
            });
        });

        it('should index countries by slug', () => {
            instance._indexCountries();
            instance._countriesBySlug.should.deep.equal({
                'united-kingdom': { addressCountryFlag: true, countryCode: 'GB', countryNameSlug: 'united-kingdom', countryOfBirthFlag: true },
                foo: { addressCountryFlag: true, countryCode: 'FO', countryNameSlug: 'foo', countryOfBirthFlag: false },
                bar: { addressCountryFlag: false, countryCode: 'BA', countryNameSlug: 'bar', countryOfBirthFlag: true },
                narnia: { addressCountryFlag: null, countryCode: 'NA', countryNameSlug: 'narnia', countryOfBirthFlag: null }
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
                GB: { id: 'GB', channel: 'ONLINE', contentType: 1, status: 'ACTIVE' },
                FO: { id: 'FO', channel: 'ONLINE', contentType: 2, status: 'INACTIVE' },
                BA: { id: 'BA', channel: 'NA', contentType: 7, status: 'INACTIVE' },
                NA: { id: 'NA', channel: 'ONLINE', contentType: 7, status: 'INACTIVE' }
            });
        });
    });

    describe('getCountryById', () => {
        it('should be a function', () => {
            instance.getCountryById.should.be.a('function');
        });

        it('should get a country by its id', () => {
            instance._indexCountries();
            instance.getCountryById('GB').should.deep.equal(
                {
                    addressCountryFlag: true,
                    countryCode: 'GB',
                    countryNameSlug: 'united-kingdom',
                    countryOfBirthFlag: true,
                }
            );
        });

        it('should transform UK to GB and get a country by its id', () => {
            instance._indexCountries();
            instance.getCountryById('UK').should.deep.equal(
                {
                    addressCountryFlag: true,
                    countryCode: 'GB',
                    countryNameSlug: 'united-kingdom',
                    countryOfBirthFlag: true,
                }
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
                {
                    addressCountryFlag: true,
                    countryCode: 'GB',
                    countryNameSlug: 'united-kingdom',
                    countryOfBirthFlag: true
                }
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
            instance.getCountryDataById('GB').should.deep.equal(
                {
                    addressCountryFlag: true,
                    countryCode: 'GB',
                    countryNameSlug: 'united-kingdom',
                    countryOfBirthFlag: true,
                    status: 'ACTIVE',
                    channel: 'ONLINE',
                    contentType: 1
                }
            );
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            expect(instance.getCountryDataById('??')).to.equal(undefined);
        });

        it('should return null if no policy data is found', () => {
            instance._indexCountries();
            delete instance._policiesById['FO'];
            expect(instance.getCountryDataById('FO')).to.equal(null);
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
                addressCountryFlag: true,
                countryCode: 'GB',
                countryNameSlug: 'united-kingdom',
                countryOfBirthFlag: true,
                channel: 'ONLINE',
                status: 'ACTIVE',
                contentType: 1
            });
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            expect(instance.getCountryDataBySlug('??')).to.equal(undefined);
        });

        it('should return null if no policy data is found', () => {
            instance._indexCountries();
            instance._indexPolicies();
            delete instance._policiesById['GB'];
            expect(instance.getCountryDataBySlug('united-kingdom')).to.equal(null);
        });
    });

    describe('getSlugById', () => {
        it('should be a function', () => {
            instance.getSlugById.should.be.a('function');
        });

        it('should get country slug when the id is given', () => {
            instance._indexCountries();
            instance.getSlugById('GB').should.equal('united-kingdom');
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            expect(instance.getSlugById('??')).to.equal(undefined);
        });
    });

    describe('isRestrictedById', () => {
        it('should be a function', () => {
            instance.isRestrictedById.should.be.a('function');
        });

        it('should return true for a country that is restricted', () => {
            instance._indexCountries();
            instance._indexPolicies();
            instance.isRestrictedById('NA').should.equal(true);
        });

        it('should return false for a country that is not restricted', () => {
            instance._indexCountries();
            instance._indexPolicies();
            instance.isRestrictedById('GB').should.equal(false);
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            instance._indexPolicies();
            expect(instance.isRestrictedById('??')).to.equal(undefined);
        });
    });

    describe('isActiveById', () => {
        it('should be a function', () => {
            instance.isActiveById.should.be.a('function');
        });

        it('should return true for a country that is active', () => {
            instance._indexCountries();
            instance._indexPolicies();
            instance.isActiveById('GB').should.equal(true);
        });

        it('should return false for a country that is not active', () => {
            instance._indexCountries();
            instance._indexPolicies();
            instance.isActiveById('NA').should.equal(false);
        });

        it('should return undefined if country is not found', () => {
            instance._indexCountries();
            instance._indexPolicies();
            expect(instance.isActiveById('??')).to.equal(undefined);
        });
    });

});
