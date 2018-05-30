import { isArray, isNumber } from 'util';
import { CurrencyPair, Order, OrderBook, OrderType } from '../../core';
import { YobitUtils } from './yobit-utils';

interface YobitTrade {
    type: YobitOrderType;
    price: number;
    amount: number;
}

type YobitOrderType = 'bid' | 'ask';

type YobitOrder = [
    /*price*/ number,
    /*amount*/ number
];

const Guards = {
    isErrorResponse: (data: any): data is { error: string } => {
        return data && data.hasOwnProperty('success') && data.success === 0 && data.error;
    },

    isOrderType: (data: any): data is YobitOrderType => data === 'bid' || data === 'ask',

    isYobitOrder: (data: any): data is YobitOrder => {
        return data && isArray(data) && data.length === 2 && isNumber(data[0]) && isNumber(data[1]);
    },

    isYobitOrderArray: (data: any): data is YobitOrder[] => {
        return data && isArray(data) && data.every(i => Guards.isYobitOrder(i));
    },

    isYobitTrade: (data: any): data is YobitTrade => {
        return data.type && Guards.isOrderType(data.type) && data.price && isNumber(data.price)
            && data.amount && isNumber(data.amount);
    },

    isYobitTradeArray: (data: any): data is YobitTrade[] => {
        return data && isArray(data) && data.every(o => Guards.isYobitTrade(o));
    }
};

export class YobitResponseParser {
    parseOrderBook(data: string, pair: CurrencyPair): OrderBook {
        const dataObject = JSON.parse(data);
        if (!dataObject)
            throw new Error('Data object is empty.');
        if (Guards.isErrorResponse(dataObject))
            throw new Error(dataObject.error);
        const pairSymbol = YobitUtils.getPairSymbol(pair);
        const orderBookContainer = dataObject[pairSymbol];
        if (!orderBookContainer)
            throw new Error(`Data object does not have the ${pairSymbol} property.`);
        const rawSellOrders = orderBookContainer.asks;
        const rawBuyOrders = orderBookContainer.bids;
        if (!Guards.isYobitOrderArray(rawSellOrders) || !Guards.isYobitOrderArray(rawBuyOrders))
            throw new Error('Data object does not have the asks or bids property contained array of orders');

        return {
            buyOrders: this.getOrders(rawBuyOrders, pair, OrderType.Buy),
            sellOrders: this.getOrders(rawSellOrders, pair, OrderType.Sell)
        };
    }

    parseTrades(data: string, pair: CurrencyPair): Order[] {
        const dataObject = JSON.parse(data);
        if (!dataObject)
            throw new Error('Data object is empty.');
        if (Guards.isErrorResponse(dataObject))
            throw new Error(dataObject.error);
        const pairSymbol = YobitUtils.getPairSymbol(pair);
        const yobitTrades = dataObject[pairSymbol];
        if (!Guards.isYobitTradeArray(yobitTrades))
            throw new Error(`Data object does not have the ${pairSymbol} property contained array of orders.`);

        return yobitTrades.map<Order>(o => ({
            pair,
            price: o.price,
            amount: o.amount,
            orderType: o.type === 'bid' ? OrderType.Buy : OrderType.Sell
        }));
    }

    private getOrders(items: YobitOrder[], pair: CurrencyPair, type: OrderType): Order[] {
        return items.map<Order>(o => ({
            price: o[0],
            amount: o[1],
            pair,
            orderType: type
        }));
    }
}
