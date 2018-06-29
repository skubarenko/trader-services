import { FieldGuardsMap } from 'crypto-kraken-core';
import {
    KuCoinErrorResponseResult, KuCoinOrderBook, KuCoinOrderType,
    KuCoinResponseResult, KuCoinSuccessResponseResult
} from './kucoin-types';

export const kuCoinResponseResultGuardsMap: FieldGuardsMap<KuCoinResponseResult> = {
    success: (value): value is KuCoinResponseResult['success'] => typeof value === 'boolean',
    code: (value): value is KuCoinResponseResult['code'] => typeof value === 'string'
};

export const kuCoinErrorResponseResultGuardsMap: FieldGuardsMap<KuCoinErrorResponseResult> = {
    success: (value): value is KuCoinErrorResponseResult['success'] => value === false,
    code: (value): value is KuCoinErrorResponseResult['code'] => typeof value === 'string',
    msg: (value): value is KuCoinErrorResponseResult['msg'] => typeof value === 'string'
};

export const kuCoinSuccessResponseResultGuardsMap: FieldGuardsMap<KuCoinSuccessResponseResult> = {
    success: (value): value is KuCoinSuccessResponseResult['success'] => value === true,
    code: (value): value is KuCoinSuccessResponseResult['code'] => value === 'OK',
    msg: (value): value is KuCoinSuccessResponseResult['msg'] => typeof value === 'string'
};

const isArray = (value: any): value is any[] => Array.isArray(value);
const orderBookOrderGuard = <T>(value: any): value is T => {
    return typeof value[0] === 'number' && typeof value[1] === 'number' && typeof value[2] === 'number';
};
export const kuCoinOrderBookGuardsMap: FieldGuardsMap<KuCoinOrderBook> = {
    ...kuCoinSuccessResponseResultGuardsMap,
    data: {
        _comment: (value): value is KuCoinOrderBook['data']['_comment'] => typeof value === 'string',
        BUY: {
            this: isArray as (value: any) => value is KuCoinOrderBook['data']['BUY'],
            every: orderBookOrderGuard as (value: any) => value is KuCoinOrderBook['data']['BUY'][0]
        },
        SELL: {
            this: isArray as (value: any) => value is KuCoinOrderBook['data']['SELL'],
            every: orderBookOrderGuard as (value: any) => value is KuCoinOrderBook['data']['SELL'][0]
        },
        timestamp: (value): value is KuCoinOrderBook['data']['timestamp'] => typeof value === 'number'
    }
};

export const isKuCoinOrderType = (data: any): data is KuCoinOrderType => {
    return data === KuCoinOrderType.SELL || data === KuCoinOrderType.BUY;
};
