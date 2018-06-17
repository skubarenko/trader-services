import { CurrencyPair, OrderType } from '../../core';

export const YobitUtils = {
    getPairSymbol: (pair: CurrencyPair) => `${pair[0]}_${pair[1]}`,
    getOrderTypeSymbol: (orderType: OrderType) => OrderType[orderType].toLowerCase()
};
