import { expect } from 'chai';
import { KuCoinExchangeCredentials, KuCoinService } from '../../src/index';
import * as environment from './test-utils/environment';

describe('The KuCoin service', () => {
    let kuCoinService: KuCoinService;
    let kuCoinExchangeCredentials: KuCoinExchangeCredentials;
    const minLimit = 0;
    const maxLimit = 1000;

    before(() => {
        const config = environment.load();
        if (!config)
            throw new Error('The config is not loaded');
        kuCoinService = new KuCoinService();
        kuCoinExchangeCredentials = {
            apiKey: config.KUCOIN_API_KEY,
            secret: config.KUCOIN_API_SECRET
        };
    });

    it('should get an order book correctly', async () => {
        const orderBook = await kuCoinService.getOrderBook(['ETH', 'BTC']);

        expect(orderBook.buyOrders.length)
            .to.eql(orderBook.sellOrders.length)
            .to.eql(6);
    });

    it('should get an order book with min limit equaling 0', async () => {
        const orderBook = await kuCoinService.getOrderBook(['ETH', 'BTC'], minLimit);

        expect(orderBook.buyOrders.length)
            .to.eql(orderBook.sellOrders.length)
            .to.eql(0);
    });

    it('should get an order book with max limit equaling 100', async () => {
        const orderBook = await kuCoinService.getOrderBook(['ETH', 'BTC'], maxLimit);

        expect(orderBook.buyOrders.length)
            .to.eql(orderBook.sellOrders.length)
            .to.eql(100);
    });

    it('should get trades correctly', async () => {
        const trades = await kuCoinService.getTrades(['ETH', 'BTC']);
        expect(trades.length).to.eql(10);
    });

    it('should get trades with min limit equaling 10', async () => {
        const trades = await kuCoinService.getTrades(['ETH', 'BTC'], minLimit);
        expect(trades.length).to.eql(10);
    });

    it('should get trades with max limit equaling 50', async () => {
        const trades = await kuCoinService.getTrades(['ETH', 'BTC'], maxLimit);
        expect(trades.length).to.eql(50);
    });

    it('should get a balance of coin correctly', async () => {
        const balance = await kuCoinService.getBalance('BTC', kuCoinExchangeCredentials);

        expect(balance.allAmount)
            .to.eql(balance.freeAmount)
            .to.eql(balance.lockedAmount)
            .to.eql(0);
    });

    describe('should throw an error when it get an wrong currency/currency pair', async () => {
        const wrongCurrencyPair = { 0: 'BTC', 1: 'ETH' };
        const operations: { [operationName: string]: () => Promise<any> } = {
            getOrderBook: async () => await kuCoinService.getOrderBook(wrongCurrencyPair),
            getTrades: async () => await kuCoinService.getTrades(wrongCurrencyPair),
            getBalance: async () => await kuCoinService.getBalance('wrong_currency', kuCoinExchangeCredentials),
            getActiveOrders:
                async () => await kuCoinService.getActiveOrders(wrongCurrencyPair, kuCoinExchangeCredentials)
        };

        Object.getOwnPropertyNames(operations).forEach(operationName => {
            it(`The operation === ${operationName}`, async () => {
                try {
                    await operations[operationName]();
                    expect.fail(`This operation (${operationName}) should throw an exception`);
                } catch (error) {
                    expect(error.statusCode).to.eql(false, ``);
                    expect(error.code).to.eql('ERROR');
                    expect(error.msg).to.eql('SYMBOL NOT FOUND');
                }
            });
        });
    });
});