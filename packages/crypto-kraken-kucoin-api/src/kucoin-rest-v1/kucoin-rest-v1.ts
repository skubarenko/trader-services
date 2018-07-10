import { CurrencyPair, FieldsSelector, FieldsSelectorResult, is } from 'crypto-kraken-core';
import * as request from 'request-promise-native';
import { KuCoinConstants } from './kucoin-constants';
import { KuCoinUtils } from './kucoin-utils';
import {
    KuCoinAllCoinsTick,
    kuCoinAllCoinsTickGuardsMap,
    KuCoinBuyOrderBooks,
    kuCoinBuyOrderBooksGuardsMap,
    KuCoinErrorResponseResult,
    kuCoinErrorResponseResultGuardsMap,
    KuCoinListExchangeRateOfCoins,
    kuCoinListExchangeRateOfCoinsGuardsMap,
    KuCoinListLanguages,
    kuCoinListLanguagesGuardsMap,
    KuCoinListTradingMarkets,
    kuCoinListTradingMarketsGuardsMap,
    KuCoinOrderBooks,
    kuCoinOrderBooksGuardsMap,
    KuCoinOrderType,
    kuCoinResponseResultGuardsMap,
    KuCoinSellOrderBooks,
    kuCoinSellOrderBooksGuardsMap,
    KuCoinTick,
    kuCoinTickGuardsMap
} from './types';

export interface KuCoinRestV1Options {
    serverUri: string;
    nonceFactory: () => Promise<number> | number;
}

const defaultKuCoinRestV1Options: KuCoinRestV1Options = {
    serverUri: KuCoinConstants.serverProductionUrl,
    nonceFactory: () => {
        /* istanbul ignore next */
        throw new Error('Not implemented.');
    }
};

interface OrderBooksParameters {
    symbol: CurrencyPair;
    group?: number;
    limit?: number;
    direction?: KuCoinOrderType;
}

interface BuyOrderBooksParameters {
    symbol: CurrencyPair;
    group?: number;
    limit?: number;
}

type SellOrderBooksParameters = BuyOrderBooksParameters;

export class KuCoinRestV1 {
    readonly serverUri: string;
    readonly nonceFactory: () => Promise<number> | number;

    constructor(options?: Partial<KuCoinRestV1Options>) {
        const {
            serverUri, nonceFactory
        } = options ? { ...defaultKuCoinRestV1Options, ...options } : { ...defaultKuCoinRestV1Options };

        this.serverUri = serverUri;
        this.nonceFactory = nonceFactory;
    }

    async listExchangeRateOfCoins(parameters?: {
        coins?: string[]
    }): Promise<KuCoinListExchangeRateOfCoins | KuCoinErrorResponseResult>;
    async listExchangeRateOfCoins<T extends FieldsSelector<KuCoinListExchangeRateOfCoins>>(
        parameters?: { coins?: string[] }, checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinListExchangeRateOfCoins, T> | KuCoinErrorResponseResult>;
    async listExchangeRateOfCoins<T>(
        parameters?: { coins?: string[] }, checkFields?: T
    ): Promise<KuCoinListExchangeRateOfCoins | FieldsSelectorResult<KuCoinListExchangeRateOfCoins, T> |
    KuCoinErrorResponseResult> {
        const requestOptions: request.RequestPromiseOptions = {
            baseUrl: this.serverUri
        };
        if (parameters && parameters.coins && parameters.coins.length > 0)
            requestOptions.qs = {
                coins: parameters.coins.join(',')
            };
        const rawResponseResult = await request.get(KuCoinConstants.listExchangeRateOfCoinsUri, requestOptions);

        const responseResult = this.parseRawResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinListExchangeRateOfCoins, T>(
            responseResult, kuCoinListExchangeRateOfCoinsGuardsMap, checkFields
        )))
            throw new Error(`The result ${responseResult} isn't the KuCoin list exchange rate of coins type.`);
        return responseResult;
    }

    async listLanguages(): Promise<KuCoinListLanguages | KuCoinErrorResponseResult>;
    async listLanguages<T extends FieldsSelector<KuCoinListLanguages>>(
        checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinListLanguages, T> | KuCoinErrorResponseResult>;
    async listLanguages<T extends FieldsSelector<KuCoinListLanguages>>(
        checkFields?: T
    ): Promise<KuCoinListLanguages | FieldsSelectorResult<KuCoinListLanguages, T> | KuCoinErrorResponseResult> {
        const rawResponseResult = await request.get(KuCoinConstants.listLanguagesUri, {
            baseUrl: this.serverUri
        });

        const responseResult = this.parseRawResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinListLanguages, T>(responseResult, kuCoinListLanguagesGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin language list type.`);
        return responseResult;
    }

    async tick(): Promise<KuCoinAllCoinsTick | KuCoinErrorResponseResult>;
    async tick(parameters: { symbol: CurrencyPair }): Promise<KuCoinTick | KuCoinErrorResponseResult>;
    async tick(
        parameters: { symbol?: CurrencyPair }
    ): Promise<KuCoinAllCoinsTick | KuCoinTick | KuCoinErrorResponseResult>;
    async tick<T extends FieldsSelector<KuCoinAllCoinsTick>>(
        parameters: undefined, checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinAllCoinsTick, T> | KuCoinErrorResponseResult>;
    async tick<T extends FieldsSelector<KuCoinTick>>(
        parameters: { symbol: CurrencyPair }, checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinTick, T> | KuCoinErrorResponseResult>;
    async tick<T extends FieldsSelector<KuCoinTick>>(
        parameters: { symbol?: CurrencyPair }, checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinAllCoinsTick | KuCoinTick, T> | KuCoinErrorResponseResult>;
    async tick<T>(
        parameters?: { symbol?: CurrencyPair }, checkFields?: T
    ): Promise<
    KuCoinAllCoinsTick | KuCoinTick | FieldsSelectorResult<KuCoinAllCoinsTick, T> |
    FieldsSelectorResult<KuCoinTick, T> | KuCoinErrorResponseResult
    > {
        const isAllCoins = !(parameters && parameters.symbol);
        const requestOptions: request.RequestPromiseOptions = {
            baseUrl: this.serverUri
        };
        if (!isAllCoins)
            requestOptions.qs = {
                // The result of checking of parameters and symbol fields is saved in the isAllCoins constant above
                symbol: KuCoinUtils.getSymbol(parameters!.symbol!)
            };
        const rawResponseResult = await request.get(KuCoinConstants.tickUri, requestOptions);

        const responseResult = this.parseRawResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if ((isAllCoins && is<KuCoinAllCoinsTick, T>(responseResult, kuCoinAllCoinsTickGuardsMap, checkFields)) ||
            (!isAllCoins && is<KuCoinTick, T>(responseResult, kuCoinTickGuardsMap, checkFields)))
            return responseResult;
        throw new Error(`The result ${responseResult} isn't the KuCoin tick type.`);
    }

    async orderBooks(parameters: OrderBooksParameters): Promise<KuCoinOrderBooks | KuCoinErrorResponseResult>;
    async orderBooks<T extends FieldsSelector<KuCoinOrderBooks>>(
        parameters: OrderBooksParameters, checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinOrderBooks, T> | KuCoinErrorResponseResult>;
    async orderBooks<T>(
        parameters: OrderBooksParameters, checkFields?: T
    ): Promise<KuCoinOrderBooks | FieldsSelectorResult<KuCoinOrderBooks, T> | KuCoinErrorResponseResult> {
        const rawResponseResult = await request.get(KuCoinConstants.orderBooksUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol),
                group: parameters.group,
                limit: parameters.limit,
                direction: parameters.direction
            }
        });

        const responseResult = this.parseRawResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinOrderBooks, T>(responseResult, kuCoinOrderBooksGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin order book type.`);
        return responseResult;
    }

    async buyOrderBooks(parameters: BuyOrderBooksParameters): Promise<KuCoinBuyOrderBooks | KuCoinErrorResponseResult>;
    async buyOrderBooks<T extends FieldsSelector<KuCoinBuyOrderBooks>>(
        parameters: BuyOrderBooksParameters, checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinBuyOrderBooks, T> | KuCoinErrorResponseResult>;
    async buyOrderBooks<T>(
        parameters: BuyOrderBooksParameters, checkFields?: T
    ): Promise<KuCoinBuyOrderBooks | FieldsSelectorResult<KuCoinBuyOrderBooks, T> | KuCoinErrorResponseResult> {
        const rawResponseResult = await request.get(KuCoinConstants.buyOrderBooksUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol),
                group: parameters.group,
                limit: parameters.limit
            }
        });

        const responseResult = this.parseRawResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinBuyOrderBooks, T>(responseResult, kuCoinBuyOrderBooksGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin buy order book type.`);
        return responseResult;
    }

    async sellOrderBooks(
        parameters: SellOrderBooksParameters
    ): Promise<KuCoinSellOrderBooks | KuCoinErrorResponseResult>;
    async sellOrderBooks<T extends FieldsSelector<KuCoinSellOrderBooks>>(
        parameters: SellOrderBooksParameters, checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinSellOrderBooks, T> | KuCoinErrorResponseResult>;
    async sellOrderBooks<T>(
        parameters: SellOrderBooksParameters, checkFields?: T
    ): Promise<KuCoinSellOrderBooks | FieldsSelectorResult<KuCoinSellOrderBooks, T> | KuCoinErrorResponseResult> {
        const rawResponseResult = await request.get(KuCoinConstants.sellOrderBooksUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol),
                group: parameters.group,
                limit: parameters.limit
            }
        });

        const responseResult = this.parseRawResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinSellOrderBooks, T>(responseResult, kuCoinSellOrderBooksGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin sell order book type.`);
        return responseResult;
    }

    async listTradingMarkets(): Promise<KuCoinListTradingMarkets | KuCoinErrorResponseResult>;
    async listTradingMarkets<T extends FieldsSelector<KuCoinListTradingMarkets>>(
        checkFields: T
    ): Promise<FieldsSelectorResult<KuCoinListTradingMarkets, T> | KuCoinErrorResponseResult>;
    async listTradingMarkets<T>(
        checkFields?: T
    ): Promise<
    KuCoinListTradingMarkets | FieldsSelectorResult<KuCoinListTradingMarkets, T> | KuCoinErrorResponseResult
    > {
        const rawResponseResult = await request.get(KuCoinConstants.listTradingMarketsUri, {
            baseUrl: this.serverUri
        });

        const responseResult = this.parseRawResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinListTradingMarkets, T>(responseResult, kuCoinListTradingMarketsGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin list of trading markets.`);
        return responseResult;
    }

    protected parseRawResponseResult<T>(rawResponseResult: string, checkFields: T) {
        const obj = JSON.parse(rawResponseResult);
        if (is(obj, kuCoinResponseResultGuardsMap, checkFields))
            return obj;
        throw new Error(`The result ${rawResponseResult} isn't a KuCoin response result.`);
    }
}
