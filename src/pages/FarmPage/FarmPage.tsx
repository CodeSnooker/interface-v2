import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@material-ui/core';
import { getBulkPairData } from 'state/stake/hooks';
import { ReactComponent as HelpIcon } from 'assets/images/HelpIcon1.svg';
import { useActiveWeb3React } from 'hooks';
import { GlobalConst } from 'constants/index';
import FarmRewards from './FarmRewards';
import FarmsList from './FarmsList';
import { CustomSwitch } from 'components';
import { useTranslation } from 'react-i18next';
import 'pages/styles/farm.scss';
import { useDefaultFarmList } from 'state/farms/hooks';
import { useDefaultDualFarmList } from 'state/dualfarms/hooks';
import { ChainId } from '@uniswap/sdk';
import CNTWallet from 'components/CNTWallet/CNTWallet';
import { useDefaultCntFarmList } from 'state/cntfarms/hooks';

const FarmPage: React.FC = () => {
  const { chainId } = useActiveWeb3React();
  const { t } = useTranslation();
  const [bulkPairs, setBulkPairs] = useState<any>(null);
  const [farmIndex, setFarmIndex] = useState(
    GlobalConst.farmIndex.LPFARM_INDEX,
  );
  const chainIdOrDefault = chainId ?? ChainId.MATIC;
  const lpFarms = useDefaultFarmList();
  const dualFarms = useDefaultDualFarmList();
  // const cntFarms = useDefaultCntFarmList();

  // useEffect(() => {
  //   console.log('farms states ', { lpFarms, dualFarms, cntFarms });
  // }, [cntFarms, dualFarms, lpFarms]);
  const pairLists = useMemo(() => {
    const stakingPairLists = Object.values(lpFarms[chainIdOrDefault]).map(
      (item) => item.pair,
    );
    const dualPairLists = Object.values(dualFarms[chainIdOrDefault]).map(
      (item) => item.pair,
    );
    // const cntPairLists = Object.values(cntFarms[chainIdOrDefault]).map(
    //   (item) => item.pair,
    // );
    // console.log('cnt-farm cntPairList', { cntPairLists, cntFarms });
    const list = stakingPairLists.concat(dualPairLists);
    return list;
  }, [chainIdOrDefault, lpFarms, dualFarms]);

  useEffect(() => {
    getBulkPairData(pairLists).then((data) => setBulkPairs(data));
  }, [pairLists]);

  const farmCategories = [
    {
      text: t('lpMining'),
      onClick: () => setFarmIndex(GlobalConst.farmIndex.LPFARM_INDEX),
      condition: farmIndex === GlobalConst.farmIndex.LPFARM_INDEX,
    },
    {
      text: t('Other LP'),
      onClick: () => setFarmIndex(GlobalConst.farmIndex.OTHER_LPFARM_INDEX),
      condition: farmIndex === GlobalConst.farmIndex.OTHER_LPFARM_INDEX,
    },
    {
      text: t('dualMining'),
      onClick: () => setFarmIndex(GlobalConst.farmIndex.DUALFARM_INDEX),
      condition: farmIndex === GlobalConst.farmIndex.DUALFARM_INDEX,
    },
  ];

  return (
    <Box width='100%' mb={3} id='farmPage'>
      <Box className='pageHeading'>
        <Box mr={2}>
          <h4>{t('farm')}</h4>
        </Box>
        <Box className='helpWrapper'>
          <small>{t('help')}</small>
          <HelpIcon />
        </Box>
      </Box>
      <Box className='flex flex-wrap justify-between items-center'>
        <CustomSwitch
          width={350}
          height={48}
          items={farmCategories}
          isLarge={true}
        />
        {farmIndex === GlobalConst.farmIndex.OTHER_LPFARM_INDEX && (
          <CNTWallet />
        )}
      </Box>
      <Box my={2}>
        <FarmRewards bulkPairs={bulkPairs} farmIndex={farmIndex} />
      </Box>
      <Box className='farmsWrapper'>
        <FarmsList bulkPairs={bulkPairs} farmIndex={farmIndex} />
      </Box>
    </Box>
  );
};

export default FarmPage;
