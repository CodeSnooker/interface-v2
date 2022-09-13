import { nanoid } from '@reduxjs/toolkit';
import { ChainId } from '@uniswap/sdk';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getNetworkLibrary, NETWORK_CHAIN_ID } from '../connectors';
import { AppDispatch } from 'state';
import resolveENSContentHash from 'utils/resolveENSContentHash';
import { useActiveWeb3React } from 'hooks';
import { fetchFarmList } from 'state/farms/actions';
import { fetchFarms } from '@cryption/dapp-factory-sdk';

import getFarmList from 'utils/getFarmList';
import { FarmListInfo } from 'types';
import { fetchCntFarmList } from 'state/cntfarms/actions';
import { getAllCntFarms } from 'utils';

export function useFetchCntFarmListCallback(): (listUrl: string) => any {
  const { library, account, chainId } = useActiveWeb3React();
  const dispatch = useDispatch<AppDispatch>();

  //TODO: support multi chain
  // const ensResolver = useCallback(
  //   (ensName: string) => {
  //     if (!library) {
  //       throw new Error('Could not construct mainnet ENS resolver');
  //     }
  //     return resolveENSContentHash(ensName, library);
  //   },
  //   [library],
  // );

  // console.log('farm list init hook');

  return useCallback(
    async (listUrl: string) => {
      const requestId = nanoid();
      dispatch(fetchCntFarmList.pending({ requestId, url: listUrl }));

      // const fetchPromise = fetchFarms(
      //   chainId || 80001,
      //   1,
      //   [],
      //   account || undefined,
      // );

      const fetchPromise = getAllCntFarms();

      return fetchPromise
        .then((farmList) => {
          console.log('cnt-farm  fetched from cnt', farmList);
          dispatch(
            fetchCntFarmList.fulfilled({ url: listUrl, farmList, requestId }),
          );
          return farmList;
        })
        .catch((error) => {
          console.debug(
            `farm list Failed to get list at url ${listUrl}`,
            error,
          );
          dispatch(
            fetchCntFarmList.rejected({
              url: listUrl,
              requestId,
              errorMessage: error.message,
            }),
          );
          throw error;
        });
    },
    [dispatch],
  );
}
