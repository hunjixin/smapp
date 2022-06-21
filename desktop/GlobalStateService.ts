import { ProtoGrpcType } from '../proto/global_state';
import { Account__Output } from '../proto/spacemesh/v1/Account';
import { AccountData__Output } from '../proto/spacemesh/v1/AccountData';
import { AccountDataFlag } from '../proto/spacemesh/v1/AccountDataFlag';
import { AccountDataStreamResponse__Output } from '../proto/spacemesh/v1/AccountDataStreamResponse';
import { Reward__Output } from '../proto/spacemesh/v1/Reward';
import { TransactionReceipt__Output } from '../proto/spacemesh/v1/TransactionReceipt';
import { PublicService, SocketAddress } from '../shared/types';
import { GlobalStateHash } from '../app/types/events';
import Logger from './logger';
import NetServiceFactory from './NetServiceFactory';
import { toHexString } from './utils';

const PROTO_PATH = 'proto/global_state.proto';

export interface AccountDataStreamHandlerArg {
  [AccountDataFlag.ACCOUNT_DATA_FLAG_REWARD]: Reward__Output;
  [AccountDataFlag.ACCOUNT_DATA_FLAG_ACCOUNT]: Account__Output;
  [AccountDataFlag.ACCOUNT_DATA_FLAG_TRANSACTION_RECEIPT]: TransactionReceipt__Output;
}

export type AccountDataValidFlags = Exclude<
  AccountDataFlag,
  AccountDataFlag.ACCOUNT_DATA_FLAG_UNSPECIFIED
>;
type AccountDataStreamKey = Exclude<keyof AccountData__Output, 'datum'>;

const ACCOUNT_DATA_KEYS: Record<AccountDataValidFlags, AccountDataStreamKey> = {
  [AccountDataFlag.ACCOUNT_DATA_FLAG_REWARD]: 'reward',
  [AccountDataFlag.ACCOUNT_DATA_FLAG_TRANSACTION_RECEIPT]: 'receipt',
  [AccountDataFlag.ACCOUNT_DATA_FLAG_ACCOUNT]: 'accountWrapper',
};
const getKeyByAccountDataFlag = (
  flag: AccountDataValidFlags
): AccountDataStreamKey => ACCOUNT_DATA_KEYS[flag];

class GlobalStateService extends NetServiceFactory<
  ProtoGrpcType,
  'GlobalStateService'
> {
  logger = Logger({ className: 'GlobalStateService' });

  createService = (apiUrl?: SocketAddress | PublicService) => {
    this.createNetService(PROTO_PATH, apiUrl, 'GlobalStateService');
  };

  getGlobalStateHash = (): Promise<GlobalStateHash> =>
    this.callService('GlobalStateHash', {}).then((response) => ({
      layer: response.response?.layer?.number || 0,
      rootHash: response.response?.rootHash
        ? toHexString(response.response.rootHash)
        : '',
    }));

  sendAccountDataQuery = <F extends AccountDataValidFlags>({
    filter,
    offset,
  }: {
    filter: {
      accountId: { address: Uint8Array };
      accountDataFlags: F;
    };
    offset: number;
  }) =>
    this.callService('AccountDataQuery', { filter, maxResults: 50, offset })
      .then((response) => ({
        totalResults: response.totalResults,
        data: response.accountItem.map(
          (item) =>
            item[
              getKeyByAccountDataFlag(filter.accountDataFlags)
            ] as AccountDataStreamHandlerArg[F]
        ),
      }))
      .then(this.normalizeServiceResponse)
      .catch(
        this.normalizeServiceError({
          totalResults: 0,
          data: <AccountDataStreamHandlerArg[F][]>[],
        })
      );

  activateAccountDataStream = <K extends AccountDataValidFlags>(
    address: Uint8Array,
    accountDataFlags: K,
    handler: (data: AccountDataStreamHandlerArg[K]) => void
  ) =>
    this.runStream(
      'AccountDataStream',
      {
        filter: {
          accountId: { address },
          accountDataFlags,
        },
      },
      (data: AccountDataStreamResponse__Output) => {
        const { datum } = data;
        const key = getKeyByAccountDataFlag(accountDataFlags);
        if (datum && datum[key]) {
          const value = datum[key] as AccountDataStreamHandlerArg[K];
          handler(value);
        }
      }
    );

  listenRewardsByCoinbase = (
    coinbase: Uint8Array,
    handler: (data: Reward__Output) => void
  ) =>
    this.activateAccountDataStream(
      coinbase,
      AccountDataFlag.ACCOUNT_DATA_FLAG_REWARD,
      handler
    );
}

export default GlobalStateService;
