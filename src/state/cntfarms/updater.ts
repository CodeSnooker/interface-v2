import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useActiveWeb3React } from 'hooks';
import { useFetchFarmListCallback } from 'hooks/useFetchFarmListCallback';
import useInterval from 'hooks/useInterval';
import useIsWindowVisible from 'hooks/useIsWindowVisible';
import { AppDispatch, AppState } from 'state';
import { acceptCntFarmUpdate } from './actions';
import { useFetchCntFarmListCallback } from 'hooks/useCntFetchFarmListCallback';

export default function Updater(): null {
  const { library } = useActiveWeb3React();
  const dispatch = useDispatch<AppDispatch>();
  const farms = useSelector<AppState, AppState['cntfarms']['byUrl']>(
    (state) => state.farms.byUrl,
  );

  const isWindowVisible = useIsWindowVisible();

  const fetchFarmList = useFetchCntFarmListCallback();
  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) return;
    Object.keys(farms).forEach((url) =>
      fetchFarmList(url).catch((error: any) =>
        console.debug('interval list fetching error', error),
      ),
    );
  }, [fetchFarmList, isWindowVisible, farms]);

  // fetch all lists every 10 minutes, but only after we initialize library
  useInterval(fetchAllListsCallback, library ? 1000 * 60 * 10 : null);

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(farms).forEach((listUrl) => {
      const farm = farms[listUrl];

      if (!farm.current && !farm.loadingRequestId && !farm.error) {
        fetchFarmList(listUrl).catch((error: any) =>
          console.debug('list added fetching error', error),
        );
      }
    });
  }, [dispatch, fetchFarmList, library, farms]);

  // automatically update lists if versions are minor/patch
  useEffect(() => {
    Object.keys(farms).forEach((listUrl) => {
      const farm = farms[listUrl];
      if (farm.current && farm.pendingUpdate) {
        //Auto update farms until we create the versioning infrastructure that the tokens list has
        dispatch(acceptCntFarmUpdate(listUrl));
      }
    });
  }, [dispatch, farms]);

  return null;
}
