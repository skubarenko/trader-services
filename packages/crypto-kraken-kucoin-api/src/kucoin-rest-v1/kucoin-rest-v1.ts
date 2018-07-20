import {
    CurrencyPair, FieldsSelector, FieldsSelectorResult, is, Omit,
    TradingViewBarsArrays, tradingViewBarsArraysGuardsMap,
    TradingViewError, tradingViewErrorGuardsMap
} from 'crypto-kraken-core';
import * as request from 'request-promise-native';
import { KuCoinConstants } from './kucoin-constants';
import { KuCoinUtils } from './kucoin-utils';
import {
    KuCoinAllCoinsTick,
    kuCoinAllCoinsTickGuardsMap,
    KuCoinBuyOrderBooks,
    kuCoinBuyOrderBooksGuardsMap,
    KuCoinCoinInfo,
    kuCoinCoinInfoGuardsMap,
    KuCoinErrorResponseResult,
    kuCoinErrorResponseResultGuardsMap,
    KuCoinListCoins,
    kuCoinListCoinsGuardsMap,
    KuCoinListExchangeRateOfCoins,
    kuCoinListExchangeRateOfCoinsGuardsMap,
    KuCoinListLanguages,
    kuCoinListLanguagesGuardsMap,
    KuCoinListTradingMarkets,
    kuCoinListTradingMarketsGuardsMap,
    KuCoinListTradingSymbolsTick,
    kuCoinListTradingSymbolsTickGuardsMap,
    KuCoinListTrendings,
    kuCoinListTrendingsGuardsMap,
    KuCoinOrderBooks,
    kuCoinOrderBooksGuardsMap,
    KuCoinOrderType,
    KuCoinRecentlyDealOrders,
    kuCoinRecentlyDealOrdersGuardsMap,
    KuCoinResponseResult,
    kuCoinResponseResultGuardsMap,
    KuCoinSellOrderBooks,
    kuCoinSellOrderBooksGuardsMap,
    KuCoinSuccessResponseResult,
    KuCoinTick,
    kuCoinTickGuardsMap,
    KuCoinTradingViewKLineConfig,
    kuCoinTradingViewKLineConfigGuardsMap,
    KuCoinTradingViewSymbolTick,
    kuCoinTradingViewSymbolTickGuardsMap
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

interface RecentlyDealOrdersParameters {
    symbol: CurrencyPair;
    limit?: number;
    since?: number;
}

interface TradingViewKLineDataParameters {
    symbol: CurrencyPair;
    resolution?: string;
    from: number;
    to: number;
}

export type KuCoinFieldsSelector<T extends KuCoinResponseResult> = FieldsSelector<Omit<T, keyof KuCoinResponseResult>>;

export type KuCoinTypeCheckedOperationResult<
    Type extends KuCoinResponseResult,
    CheckFields extends FieldsSelector<Omit<Type, keyof KuCoinResponseResult>>
    > = (
        FieldsSelectorResult<Omit<Type, keyof KuCoinResponseResult>, CheckFields> & KuCoinSuccessResponseResult
    ) | KuCoinErrorResponseResult;

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
    async listExchangeRateOfCoins<T extends KuCoinFieldsSelector<KuCoinListExchangeRateOfCoins>>(
        parameters?: { coins?: string[] }, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinListExchangeRateOfCoins, T>>;
    async listExchangeRateOfCoins<T>(
        parameters?: { coins?: string[] }, checkFields?: T
    ): Promise<KuCoinListExchangeRateOfCoins | KuCoinTypeCheckedOperationResult<KuCoinListExchangeRateOfCoins, T>> {
        const requestOptions: request.RequestPromiseOptions = {
            baseUrl: this.serverUri
        };
        if (parameters && parameters.coins && parameters.coins.length > 0)
            requestOptions.qs = {
                coins: parameters.coins.join(',')
            };
        const rawResponseResult = await request.get(KuCoinConstants.listExchangeRateOfCoinsUri, requestOptions);

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinListExchangeRateOfCoins, T>(
            responseResult, kuCoinListExchangeRateOfCoinsGuardsMap, checkFields
        )))
            throw new Error(`The result ${responseResult} isn't the KuCoin list exchange rate of coins type.`);
        return responseResult;
    }

    async listLanguages(): Promise<KuCoinListLanguages | KuCoinErrorResponseResult>;
    async listLanguages<T extends KuCoinFieldsSelector<KuCoinListLanguages>>(
        checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinListLanguages, T>>;
    async listLanguages<T>(
        checkFields?: T
    ): Promise<KuCoinListLanguages | KuCoinTypeCheckedOperationResult<KuCoinListLanguages, T>> {
        const rawResponseResult = await request.get(KuCoinConstants.listLanguagesUri, {
            baseUrl: this.serverUri
        });

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
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
    async tick<T extends KuCoinFieldsSelector<KuCoinAllCoinsTick>>(
        parameters: undefined, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinAllCoinsTick, T>>;
    async tick<T extends KuCoinFieldsSelector<KuCoinTick>>(
        parameters: { symbol: CurrencyPair }, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinTick, T>>;
    async tick<T extends KuCoinFieldsSelector<KuCoinTick>>(
        parameters: { symbol?: CurrencyPair }, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinAllCoinsTick | KuCoinTick, T>>;
    async tick<T>(
        parameters?: { symbol?: CurrencyPair }, checkFields?: T
    ): Promise<
    KuCoinAllCoinsTick | KuCoinTick | KuCoinTypeCheckedOperationResult<KuCoinAllCoinsTick, T> |
    KuCoinTypeCheckedOperationResult<KuCoinTick, T>
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

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if ((isAllCoins && is<KuCoinAllCoinsTick, T>(responseResult, kuCoinAllCoinsTickGuardsMap, checkFields)) ||
            (!isAllCoins && is<KuCoinTick, T>(responseResult, kuCoinTickGuardsMap, checkFields)))
            return responseResult;
        throw new Error(`The result ${responseResult} isn't the KuCoin tick type.`);
    }

    async orderBooks(parameters: OrderBooksParameters): Promise<KuCoinOrderBooks | KuCoinErrorResponseResult>;
    async orderBooks<T extends KuCoinFieldsSelector<KuCoinOrderBooks>>(
        parameters: OrderBooksParameters, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinOrderBooks, T>>;
    async orderBooks<T>(
        parameters: OrderBooksParameters, checkFields?: T
    ): Promise<KuCoinOrderBooks | KuCoinTypeCheckedOperationResult<KuCoinOrderBooks, T>> {
        const rawResponseResult = await request.get(KuCoinConstants.orderBooksUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol),
                group: parameters.group,
                limit: parameters.limit,
                direction: parameters.direction
            }
        });

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinOrderBooks, T>(responseResult, kuCoinOrderBooksGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin order book type.`);
        return responseResult;
    }

    async buyOrderBooks(parameters: BuyOrderBooksParameters): Promise<KuCoinBuyOrderBooks | KuCoinErrorResponseResult>;
    async buyOrderBooks<T extends KuCoinFieldsSelector<KuCoinBuyOrderBooks>>(
        parameters: BuyOrderBooksParameters, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinBuyOrderBooks, T>>;
    async buyOrderBooks<T>(
        parameters: BuyOrderBooksParameters, checkFields?: T
    ): Promise<KuCoinBuyOrderBooks | KuCoinTypeCheckedOperationResult<KuCoinBuyOrderBooks, T>> {
        const rawResponseResult = await request.get(KuCoinConstants.buyOrderBooksUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol),
                group: parameters.group,
                limit: parameters.limit
            }
        });

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinBuyOrderBooks, T>(responseResult, kuCoinBuyOrderBooksGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin buy order book type.`);
        return responseResult;
    }

    async sellOrderBooks(
        parameters: SellOrderBooksParameters
    ): Promise<KuCoinSellOrderBooks | KuCoinErrorResponseResult>;
    async sellOrderBooks<T extends KuCoinFieldsSelector<KuCoinSellOrderBooks>>(
        parameters: SellOrderBooksParameters, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinSellOrderBooks, T>>;
    async sellOrderBooks<T>(
        parameters: SellOrderBooksParameters, checkFields?: T
    ): Promise<KuCoinSellOrderBooks | KuCoinTypeCheckedOperationResult<KuCoinSellOrderBooks, T>> {
        const rawResponseResult = await request.get(KuCoinConstants.sellOrderBooksUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol),
                group: parameters.group,
                limit: parameters.limit
            }
        });

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinSellOrderBooks, T>(responseResult, kuCoinSellOrderBooksGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin sell order book type.`);
        return responseResult;
    }

    async recentlyDealOrders(
        parameters: RecentlyDealOrdersParameters
    ): Promise<KuCoinRecentlyDealOrders | KuCoinErrorResponseResult>;
    async recentlyDealOrders<T extends KuCoinFieldsSelector<KuCoinRecentlyDealOrders>>(
        parameters: RecentlyDealOrdersParameters, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinRecentlyDealOrders, T>>;
    async recentlyDealOrders<T>(
        parameters: RecentlyDealOrdersParameters, checkFields?: T
    ): Promise<KuCoinRecentlyDealOrders | KuCoinTypeCheckedOperationResult<KuCoinRecentlyDealOrders, T>> {
        const rawResponseResult = await request.get(KuCoinConstants.recentlyDealOrdersUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol),
                limit: parameters.limit,
                since: parameters.since
            }
        });

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinRecentlyDealOrders, T>(responseResult, kuCoinRecentlyDealOrdersGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin list of recently deal orders.`);
        return responseResult;
    }

    async listTradingMarkets(): Promise<KuCoinListTradingMarkets | KuCoinErrorResponseResult>;
    async listTradingMarkets<T extends KuCoinFieldsSelector<KuCoinListTradingMarkets>>(
        checkFields: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinListTradingMarkets, T>>;
    async listTradingMarkets<T>(
        checkFields?: T
    ): Promise<KuCoinListTradingMarkets | KuCoinTypeCheckedOperationResult<KuCoinListTradingMarkets, T>> {
        const rawResponseResult = await request.get(KuCoinConstants.listTradingMarketsUri, {
            baseUrl: this.serverUri
        });

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinListTradingMarkets, T>(responseResult, kuCoinListTradingMarketsGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin list of trading markets.`);
        return responseResult;
    }

    async listTradingSymbolsTick(
        parameters?: { market?: string }
    ): Promise<KuCoinListTradingSymbolsTick | KuCoinErrorResponseResult>;
    async listTradingSymbolsTick<T extends KuCoinFieldsSelector<KuCoinListTradingSymbolsTick>>(
        parameters?: { market?: string }, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinListTradingSymbolsTick, T>>;
    async listTradingSymbolsTick<T>(
        parameters?: { market?: string }, checkFields?: T
    ): Promise<KuCoinListTradingSymbolsTick | KuCoinTypeCheckedOperationResult<KuCoinListTradingSymbolsTick, T>> {
        const requestOptions: request.RequestPromiseOptions = {
            baseUrl: this.serverUri
        };
        if (parameters && parameters.market)
            requestOptions.qs = {
                market: parameters.market
            };
        const rawResponseResult = await request.get(KuCoinConstants.listTradingSymbolsTickUri, requestOptions);

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinListTradingSymbolsTick, T>(responseResult, kuCoinListTradingSymbolsTickGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin list of trading symbols tick.`);
        return responseResult;
    }

    async listTrendings(
        parameters?: { market?: string }
    ): Promise<KuCoinListTrendings | KuCoinErrorResponseResult>;
    async listTrendings<T extends KuCoinFieldsSelector<KuCoinListTrendings>>(
        parameters?: { market?: string }, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinListTrendings, T>>;
    async listTrendings<T>(
        parameters?: { market?: string }, checkFields?: T
    ): Promise<KuCoinListTrendings | KuCoinTypeCheckedOperationResult<KuCoinListTrendings, T>> {
        const requestOptions: request.RequestPromiseOptions = {
            baseUrl: this.serverUri
        };
        if (parameters && parameters.market)
            requestOptions.qs = {
                market: parameters.market
            };
        const rawResponseResult = await request.get(KuCoinConstants.listTrendingsUri, requestOptions);

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinListTrendings, T>(responseResult, kuCoinListTrendingsGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin list of trending.`);
        return responseResult;
    }

    async getTradingViewKLineConfig(): Promise<KuCoinTradingViewKLineConfig | KuCoinErrorResponseResult>;
    async getTradingViewKLineConfig<T extends FieldsSelector<KuCoinTradingViewKLineConfig>>(
        checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinTradingViewKLineConfig, T> | KuCoinErrorResponseResult>;
    async getTradingViewKLineConfig<T>(
        checkFields?: T
    ): Promise<
    KuCoinTradingViewKLineConfig | FieldsSelectorResult<KuCoinTradingViewKLineConfig, T> | KuCoinErrorResponseResult
    > {
        const rawResponseResult = await request.get(KuCoinConstants.getTradingViewKLineConfigUri, {
            baseUrl: this.serverUri
        });

        const responseResult = JSON.parse(rawResponseResult);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinTradingViewKLineConfig, T>(responseResult, kuCoinTradingViewKLineConfigGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin KLine config of the Trading View.`);
        return responseResult;
    }

    async getTradingViewSymbolTick(
        parameters: { symbol: CurrencyPair }
    ): Promise<KuCoinTradingViewSymbolTick | TradingViewError | KuCoinErrorResponseResult>;
    async getTradingViewSymbolTick<T extends FieldsSelector<KuCoinTradingViewSymbolTick>>(
        parameters: { symbol: CurrencyPair }, checkFields?: T
    ): Promise<FieldsSelectorResult<KuCoinTradingViewSymbolTick, T> | TradingViewError | KuCoinErrorResponseResult>;
    async getTradingViewSymbolTick<T>(
        parameters: { symbol: CurrencyPair }, checkFields?: T
    ): Promise<
    KuCoinTradingViewSymbolTick | TradingViewError| KuCoinErrorResponseResult |
    FieldsSelectorResult<KuCoinTradingViewSymbolTick, T>
    > {
        const rawResponseResult = await request.get(KuCoinConstants.getTradingViewSymbolTickUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol)
            }
        });

        const responseResult = JSON.parse(rawResponseResult);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields) ||
            is<TradingViewError>(responseResult, tradingViewErrorGuardsMap)
        )
            return responseResult;

        if (!(is<KuCoinTradingViewSymbolTick, T>(responseResult, kuCoinTradingViewSymbolTickGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin tick of the Trading View.`);
        return responseResult;
    }

    async getTradingViewKLineData(
        parameters: TradingViewKLineDataParameters
    ): Promise<TradingViewBarsArrays | TradingViewError | KuCoinErrorResponseResult>;
    async getTradingViewKLineData<T extends FieldsSelector<TradingViewBarsArrays>>(
        parameters: TradingViewKLineDataParameters, checkFields?: T
    ): Promise<FieldsSelectorResult<TradingViewBarsArrays, T> | TradingViewError | KuCoinErrorResponseResult>;
    async getTradingViewKLineData<T>(
        parameters: TradingViewKLineDataParameters, checkFields?: T
    ): Promise<
    TradingViewBarsArrays | TradingViewError | KuCoinErrorResponseResult |
    FieldsSelectorResult<TradingViewBarsArrays, T>
    > {
        const rawResponseResult = await request.get(KuCoinConstants.getTradingViewKLineDataUri, {
            baseUrl: this.serverUri,
            qs: {
                symbol: KuCoinUtils.getSymbol(parameters.symbol),
                resolution: parameters.resolution,
                from: parameters.from,
                to: parameters.to
            }
        });

        const responseResult = JSON.parse(rawResponseResult);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields) ||
            is<TradingViewError>(responseResult, tradingViewErrorGuardsMap)
        )
            return responseResult;

        if (!(is<TradingViewBarsArrays, T>(responseResult, tradingViewBarsArraysGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin KLineData type of the Trading View.`);
        return responseResult;
    }

    async getCoinInfo(
        parameters: { coin: string }
    ): Promise<KuCoinCoinInfo | KuCoinErrorResponseResult>;
    async getCoinInfo<T extends KuCoinFieldsSelector<KuCoinCoinInfo>>(
        parameters: { coin: string }, checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinCoinInfo, T>>;
    async getCoinInfo<T>(
        parameters: { coin: string }, checkFields?: T
    ): Promise<KuCoinCoinInfo | KuCoinTypeCheckedOperationResult<KuCoinCoinInfo, T>> {
        const rawResponseResult = await request.get(KuCoinConstants.getCoinInfoUri, {
            baseUrl: this.serverUri,
            qs: {
                coin: parameters.coin,
            }
        });

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinCoinInfo, T>(responseResult, kuCoinCoinInfoGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin coin info type.`);
        return responseResult;
    }

    async listCoins(): Promise<KuCoinListCoins | KuCoinErrorResponseResult>;
    async listCoins<T extends KuCoinFieldsSelector<KuCoinListCoins>>(
        checkFields?: T
    ): Promise<KuCoinTypeCheckedOperationResult<KuCoinListCoins, T>>;
    async listCoins<T>(
        checkFields?: T
    ): Promise<KuCoinListCoins | KuCoinTypeCheckedOperationResult<KuCoinListCoins, T>> {
        const rawResponseResult = await request.get(KuCoinConstants.listCoinsUri, {
            baseUrl: this.serverUri
        });

        const responseResult = this.parseKuCoinResponseResult(rawResponseResult, checkFields);
        if (is<KuCoinErrorResponseResult, T>(responseResult, kuCoinErrorResponseResultGuardsMap, checkFields))
            return responseResult;

        if (!(is<KuCoinListCoins, T>(responseResult, kuCoinListCoinsGuardsMap, checkFields)))
            throw new Error(`The result ${responseResult} isn't the KuCoin list of coin infos.`);
        return responseResult;
    }

    protected parseKuCoinResponseResult<T>(rawResponseResult: string, checkFields: T) {
        const obj = JSON.parse(rawResponseResult);
        if (is(obj, kuCoinResponseResultGuardsMap, checkFields))
            return obj;
        throw new Error(`The result ${rawResponseResult} isn't a KuCoin response result.`);
    }
}
