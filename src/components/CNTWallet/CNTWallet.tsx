import { Box, Button } from '@material-ui/core';
import React from 'react';
import './styles.scss';
import { ReactComponent as DissconnectIcon } from 'assets/images/dissconnect.svg';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { shortenAddress } from 'utils';
import { isMobile } from 'react-device-detect';

export default function CNTWallet() {
  const { account, active } = useWeb3React();

  return (
    <Box mt={isMobile ? 2.5 : 0} className='flex items-center'>
      <Button
        disabled={!active}
        className={active ? 'cnt-farm-btn' : 'cnt-farm-btn-disabled'}
      >
        <p className='cnt-farm-label'>Create a Farm</p>
      </Button>
      {/* <Box
        ml={1.5}
        className='flex items-center justify-between cnt-farm-wallet-container '
      >
        <Box ml={1.5} className='flex flex-col'>
          <p className='cnt-farm-label'>Dissconnect</p>
          <p className='cnt-farm-label'>{account && shortenAddress(account)}</p>
        </Box>

        <Box mr={1.5}>
          <DissconnectIcon />
        </Box>
      </Box> */}
    </Box>
  );
}
