import { Box, Button, useMediaQuery, useTheme } from '@material-ui/core';
import { ChainId } from '@uniswap/sdk';
import { ReactComponent as ExitIcon } from 'assets/images/ExitIcon.svg';
import { ReactComponent as HelpIcon } from 'assets/images/HelpIcon1.svg';
import { AdsSlider, CustomSwitch } from 'components';
import { GlobalConst } from 'constants/index';
import { useActiveWeb3React } from 'hooks';
import 'pages/styles/farm.scss';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDefaultDualFarmList } from 'state/dualfarms/hooks';
import { useDefaultFarmList } from 'state/farms/hooks';
import { getBulkPairData } from 'state/stake/hooks';
import FarmRewards from './FarmRewards';
import FarmsList from './FarmsList';

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
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('xs'));

  const pairLists = useMemo(() => {
    const stakingPairLists = Object.values(lpFarms[chainIdOrDefault]).map(
      (item) => item.pair,
    );
    const dualPairLists = Object.values(dualFarms[chainIdOrDefault]).map(
      (item) => item.pair,
    );
    return stakingPairLists.concat(dualPairLists);
  }, [chainIdOrDefault, lpFarms, dualFarms]);

  useEffect(() => {
    console.log('Pair Lists => ', pairLists);
    getBulkPairData(pairLists).then((data) => {
      setBulkPairs(data);
      console.log('bulk Pairs => ', data);
    });
  }, [pairLists]);

  const farmCategories = [
    {
      text: t('lpMining'),
      onClick: () => setFarmIndex(GlobalConst.farmIndex.LPFARM_INDEX),
      condition: farmIndex === GlobalConst.farmIndex.LPFARM_INDEX,
    },
    {
      text: 'Other LP Mining',
      onClick: () => {
        setFarmIndex(GlobalConst.farmIndex.OTHER_LP_INDEX);
      },
      condition: farmIndex === GlobalConst.farmIndex.OTHER_LP_INDEX,
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
      <Box maxWidth={isMobile ? '320px' : '1136px'} margin='0 auto 24px'>
        <AdsSlider sort='farms' />
      </Box>
      <Box className='flex flex-wrap justify-between'>
        <CustomSwitch
          width={450}
          height={48}
          items={farmCategories}
          isLarge={true}
        />
        {farmIndex === GlobalConst.farmIndex.OTHER_LP_INDEX && (
          <Box className='flex'>
            <Button className='btn-xl mr-1'>Create A Farm</Button>
            <Box className='flex btn-xl btn-exit'>
              <Box className='flex flex-col' my={'auto'} mx={1}>
                <Box fontSize={10}>DISCONNECT</Box>
                <Box fontWeight={'bold'}>0x04…324b</Box>
              </Box>
              <Box className='flex' my={'auto'} ml={2} mr={1}>
                <ExitIcon />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
      <Box my={3}>
        {farmIndex !== GlobalConst.farmIndex.OTHER_LP_INDEX ? (
          <FarmRewards bulkPairs={bulkPairs} farmIndex={farmIndex} />
        ) : (
          <></>
        )}
      </Box>
      <Box className='farmsWrapper'>
        <FarmsList bulkPairs={bulkPairs} farmIndex={farmIndex} />
      </Box>
    </Box>
  );
};

export default FarmPage;
