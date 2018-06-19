import * as request from 'request-promise-native';
import {
    AuthenticatedRestExchangeService, CurrencyBalance, CurrencyPair,
    Order, OrderBook, OrderInfo, RestExchangeService
} from '../../core';
import { Identified, RepeatPromise } from '../../utils';
import { KuCoinConstants } from './constants';
import { KuCoinAuthRequestHeaders, KuCoinExchangeCredentials } from './kucoin-exchange-credentials';
import { kuCoinNonceFactory } from './kucoin-nonce-factory';
import { KuCoinResponseParser } from './kucoin-response-parser';
import { KuCoinSignatureMaker } from './kucoin-signature-maker';
import { KuCoinUtils } from './kucoin-utils';

export class KuCoinService implements RestExchangeService, AuthenticatedRestExchangeService {
    private _kuCoinSignatureMaker: KuCoinSignatureMaker = new KuCoinSignatureMaker();
    private _kuCoinResponseParser: KuCoinResponseParser = new KuCoinResponseParser();
    private _kuCoinNonceFactory: () => Promise<number> | number = kuCoinNonceFactory;
    private _requestTryCount: number;

    constructor(readonly serverUri: string = KuCoinConstants.serverProductionUrl, requestTryCount: number = 3) {
        this._requestTryCount = requestTryCount;
    }

    protected set kuCoinResponseParser(value: KuCoinResponseParser) {
        this._kuCoinResponseParser = value;
    }

    protected get kuCoinResponseParser() {
        return this._kuCoinResponseParser;
    }

    get kuCoinSignatureMaker() {
        return this._kuCoinSignatureMaker;
    }

    set kuCoinSignatureMaker(value: KuCoinSignatureMaker) {
        this._kuCoinSignatureMaker = value;
    }

    get kuCoinNonceFactory() {
        return this._kuCoinNonceFactory;
    }

    set kuCoinNonceFactory(value: () => Promise<number> | number) {
        this._kuCoinNonceFactory = value;
    }

    get requestTryCount() {
        return this._requestTryCount;
    }

    set requestTryCount(value: number) {
        this._requestTryCount = value;
    }

    async getOrderBook(pair: CurrencyPair, maxLimit?: number): Promise<OrderBook> {
        return new RepeatPromise<OrderBook>((resolve, reject) => {
            request.get(KuCoinConstants.orderBooksUri, {
                baseUrl: this.serverUri,
                qs: {
                    symbol: this.getSymbol(pair),
                    limit: maxLimit
                }
            })
                .then(value => resolve(this.kuCoinResponseParser.parseOrderBook(value, pair)))
                .catch(reason => reject(reason));
        }, this.requestTryCount);
    }

    async getTrades(pair: CurrencyPair, maxLimit?: number): Promise<Order[]> {
        return new RepeatPromise<Order[]>((resolve, reject) => {
            request.get(KuCoinConstants.tradesUri, {
                baseUrl: this.serverUri,
                qs: {
                    symbol: this.getSymbol(pair),
                    limit: maxLimit
                }
            })
                .then(value => resolve(this.kuCoinResponseParser.parseTrades(value, pair)))
                .catch(reason => reject(reason));
        }, this.requestTryCount);
    }

    async createOrder(order: Order, exchangeCredentials: KuCoinExchangeCredentials): Promise<Identified<Order>> {
        const queryString = {
            amount: order.amount,
            price: order.price,
            symbol: this.getSymbol(order.pair),
            type: KuCoinUtils.getKuCoinOrderType(order.orderType)
        };
        const authHeaders = await this.getAuthHeaders(exchangeCredentials, KuCoinConstants.createOrderUri, queryString);
        return new RepeatPromise<Identified<Order>>((resolve, reject) => {
            request.post(KuCoinConstants.createOrderUri, {
                baseUrl: this.serverUri,
                qs: queryString,
                headers: authHeaders
            })
                .then(value => resolve(this.kuCoinResponseParser.parseCreatedOrder(value, order)))
                .catch(reason => reject(reason));
        }, this.requestTryCount);
    }

    async deleteOrder(
        identifiedOrder: Identified<Order>,
        exchangeCredentials: KuCoinExchangeCredentials
    ): Promise<void> {
        const queryStringObj = {
            orderOid: identifiedOrder.id,
            symbol: this.getSymbol(identifiedOrder.pair),
            type: KuCoinUtils.getKuCoinOrderType(identifiedOrder.orderType)
        };
        const authHeaders = await this.getAuthHeaders(
            exchangeCredentials, KuCoinConstants.deleteOrderUri, queryStringObj
        );

        return new RepeatPromise<void>((resolve, reject) => {
            request.post(KuCoinConstants.deleteOrderUri, {
                baseUrl: this.serverUri,
                qs: queryStringObj,
                headers: authHeaders
            })
                .then(value => resolve(this.kuCoinResponseParser.parseDeletedOrder(value)))
                .catch(reason => reject(reason));
        }, this.requestTryCount);
    }

    async getOrderInfo(
        identifiedOrder: Identified<Order>,
        exchangeCredentials: KuCoinExchangeCredentials
    ): Promise<OrderInfo> {
        const queryStringObj = {
            orderOid: identifiedOrder.id,
            symbol: this.getSymbol(identifiedOrder.pair),
            type: KuCoinUtils.getKuCoinOrderType(identifiedOrder.orderType)
        };
        const authHeaders = await this.getAuthHeaders(
            exchangeCredentials, KuCoinConstants.orderInfoUri, queryStringObj
        );
        const responseResult = await request.get(KuCoinConstants.orderInfoUri, {
            baseUrl: this.serverUri,
            headers: authHeaders,
            qs: queryStringObj
        });

        return this.kuCoinResponseParser.parseOrderInfo(responseResult);
    }

    async getActiveOrders(
        pair: CurrencyPair,
        exchangeCredentials: KuCoinExchangeCredentials
    ): Promise<Array<Identified<Order>>> {
        const queryStringObj = {
            symbol: this.getSymbol(pair)
        };
        const authHeaders = await this.getAuthHeaders(
            exchangeCredentials, KuCoinConstants.activeOrdersUri, queryStringObj
        );
        const responseResult = await request.get(KuCoinConstants.activeOrdersUri, {
            baseUrl: this.serverUri,
            headers: authHeaders,
            qs: queryStringObj
        });
        return this.kuCoinResponseParser.parseActiveOrders(responseResult, pair);
    }

    async getBalance(currency: string, exchangeCredentials: KuCoinExchangeCredentials): Promise<CurrencyBalance> {
        const apiEndpoint = KuCoinConstants.getBalanceOfCoinUri(currency);
        const authHeaders = await this.getAuthHeaders(exchangeCredentials, apiEndpoint, undefined);

        return new RepeatPromise<CurrencyBalance>((resolve, reject) => {
            request.get(apiEndpoint, {
                baseUrl: this.serverUri,
                headers: authHeaders
            })
                .then(value => resolve(this.kuCoinResponseParser.parseCurrencyBalance(value, currency)))
                .catch(reason => reject(reason));
        });
    }

    protected async getAuthHeaders(
        exchangeCredentials: KuCoinExchangeCredentials,
        apiEndpoint: string,
        queryString: object | string | undefined
    ): Promise<KuCoinAuthRequestHeaders> {
        const nonce = await this.kuCoinNonceFactory();
        return {
            'KC-API-KEY': exchangeCredentials.apiKey,
            'KC-API-NONCE': nonce,
            'KC-API-SIGNATURE': this.kuCoinSignatureMaker
                .sign(exchangeCredentials.secret, apiEndpoint, queryString, nonce)
        };
    }

    protected getSymbol(currencyPair: CurrencyPair) {
        return `${currencyPair[0]}-${currencyPair[1]}`;
    }
}