import { Comptroller, MarketSDK } from 'market-sdk';
import { Token, ChainId } from '@uniswap/sdk';
import { BN } from 'utils/bigUtils';
import { USDPricedPoolAsset } from './fetchPoolData';
import { getDaysCurrentYear } from 'utils';
import ERC20_ABI from '../../constants/abis/erc20.json';
import {
  testForComptrollerErrorAndSend,
  testForCTokenErrorAndSend,
} from './errors';
import { GlobalValue } from 'constants/index';

export const convertMantissaToAPY = (mantissa: any, dayRange: number) => {
  return (
    (Math.pow(
      (mantissa / 1e18) * GlobalValue.marketSDK.BLOCKSPERDAY + 1,
      dayRange,
    ) -
      1) *
    100
  );
};

export const convertMantissaToAPR = (mantissa: any) => {
  return (
    (mantissa * GlobalValue.marketSDK.BLOCKSPERDAY * getDaysCurrentYear()) /
    1e16
  );
};

export const getPoolAssetToken = (
  asset: USDPricedPoolAsset,
  chainId?: ChainId,
) => {
  return new Token(
    chainId ?? ChainId.MATIC,
    asset.underlyingToken,
    Number(asset.underlyingDecimals),
    asset.underlyingSymbol,
    asset.underlyingName,
  );
};

export const fetchGasForCall = async (
  call: any,
  amountBN: BN | undefined,
  address: string,
  sdk: MarketSDK,
) => {
  const estimatedGas = sdk.web3.utils.toBN(
    Number(
      (
        await call.estimateGas({
          from: address,
          // Cut amountBN in half in case it screws up the gas estimation by causing a fail in the event that it accounts for gasPrice > 0 which means there will not be enough ETH (after paying gas)
          value: amountBN ? amountBN.div(sdk.web3.utils.toBN(2)) : undefined,
        })
      ).toString(),
    ).toFixed(0),
  );

  // Get standard max priority fee in matic network
  const { standard } = await fetch(
    'https://gasstation-mainnet.matic.network/v2',
  ).then((res) => res.json());

  const gasPrice = sdk.web3.utils.toBN(
    sdk.web3.utils
      .toWei(Math.floor(standard.maxPriorityFee).toString(), 'gwei')
      .toString(),
  );
  const gasWEI = estimatedGas.mul(gasPrice);

  return {
    gasWEI,
    gasPrice,
    estimatedGas,
  };
};

const delay = (t: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
};

const checkAndApproveCToken = async (
  asset: USDPricedPoolAsset,
  amountBN: BN,
  address: string,
) => {
  const cToken = asset.cToken;
  const sdk = cToken.sdk;

  const underlyingContract = new sdk.web3.eth.Contract(
    ERC20_ABI as any,
    asset.underlyingToken,
  );

  const max = sdk.web3.utils
    .toBN(2)
    .pow(sdk.web3.utils.toBN(256))
    .sub(sdk.web3.utils.toBN(1));

  try {
    const hasApprovedEnough = sdk.web3.utils
      .toBN(
        await underlyingContract.methods
          .allowance(address, cToken.address)
          .call(),
      )
      .gte(amountBN);

    if (hasApprovedEnough) return true;

    const call = underlyingContract.methods.approve(cToken.address, max);
    const { gasPrice, estimatedGas } = await fetchGasForCall(
      call,
      undefined,
      address,
      sdk,
    );
    await call.send({ from: address, gasPrice, estimatedGas });
    await delay(2000);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const supply = async (
  asset: USDPricedPoolAsset,
  amount: number,
  address: string,
  enableAsCollateral: boolean,
  enterMarketError: string,
  supplyError: string,
) => {
  const cToken = asset.cToken;
  const sdk = cToken.sdk;

  const isETH =
    asset.underlyingToken.toLowerCase() ===
    GlobalValue.tokens.MATIC.address.toLowerCase();
  const amountBN = sdk.web3.utils.toBN(
    amount * 10 ** asset.underlyingDecimals.toNumber(),
  );

  const comptroller = new Comptroller(
    sdk,
    await asset.cToken.contract.methods.comptroller().call(),
  );

  let collateralEnabled = false;
  if (!asset.membership && enableAsCollateral) {
    await testForComptrollerErrorAndSend(
      comptroller.contract.methods.enterMarkets([asset.cToken.address]),
      address,
      enterMarketError,
      asset.cToken.sdk,
    );
    collateralEnabled = true;
  } else {
    collateralEnabled = true;
  }

  if (!collateralEnabled) return;
  if (isETH) {
    const ethBalance = await sdk.web3.eth.getBalance(address);

    if (amountBN.toString() === ethBalance.toString()) {
      const call = (cToken.contract.methods.mint as any)();

      // Subtract gas for max ETH
      const { gasWEI, gasPrice, estimatedGas } = await fetchGasForCall(
        call,
        amountBN,
        address,
        cToken.sdk,
      );

      const txObj = await call.send({
        from: address,
        value: amountBN.sub(gasWEI),
        gasPrice,
        gas: estimatedGas,
      } as any);
      return txObj;
    } else {
      const txObj = await (cToken.mint as any)({
        from: address,
        value: amountBN,
      });
      return txObj;
    }
  } else {
    const approved = await checkAndApproveCToken(asset, amountBN, address);
    if (!approved) return;
    const txObj = await testForCTokenErrorAndSend(
      cToken.contract.methods.mint(amountBN),
      address,
      supplyError,
      sdk,
    );
    return txObj;
  }
};

export const repayBorrow = async (
  asset: USDPricedPoolAsset,
  amount: number,
  address: string,
  repayError: string,
) => {
  const cToken = asset.cToken;
  const sdk = cToken.sdk;

  const isETH =
    asset.underlyingToken.toLowerCase() ===
    GlobalValue.tokens.MATIC.address.toLowerCase();
  const amountBN = sdk.web3.utils.toBN(
    Number(amount * 10 ** asset.underlyingDecimals.toNumber()).toFixed(0),
  );

  const isRepayingMax =
    amountBN.eq(sdk.web3.utils.toBN(asset.borrowBalance.toString())) && !isETH;

  const max = sdk.web3.utils
    .toBN(2)
    .pow(sdk.web3.utils.toBN(256))
    .sub(sdk.web3.utils.toBN(1));

  if (!isETH) {
    await checkAndApproveCToken(asset, amountBN, address);
    const txObj = await testForCTokenErrorAndSend(
      cToken.contract.methods.repayBorrow(isRepayingMax ? max : amountBN),
      address,
      repayError,
      sdk,
    );
    return txObj;
  }
  const ethBalance = await sdk.web3.eth.getBalance(address);
  const call = (cToken.contract.methods.repayBorrow as any)();

  if (amountBN.toString() === ethBalance.toString()) {
    // Subtract gas for max ETH
    const { gasWEI, gasPrice, estimatedGas } = await fetchGasForCall(
      call,
      amountBN,
      address,
      cToken.sdk,
    );

    const txObj = await call.send({
      from: address,
      value: amountBN.sub(gasWEI),

      gasPrice,
      gas: estimatedGas,
    } as any);
    return txObj;
  } else {
    const txObj = await call.send({
      from: address,
      value: amountBN,
    });
    return txObj;
  }
};

export const toggleCollateral = (
  asset: USDPricedPoolAsset,
  comptroller: Comptroller,
  address: string,
  errorMessage: string,
) => {
  if (!asset.membership) {
    return testForComptrollerErrorAndSend(
      comptroller.contract.methods.enterMarkets([asset.cToken.address]),
      address,
      errorMessage,
      asset.cToken.sdk,
    );
  } else {
    return testForComptrollerErrorAndSend(
      comptroller.contract.methods.exitMarket(asset.cToken.address),
      address,
      errorMessage,
      asset.cToken.sdk,
    );
  }
};

export const withdraw = async (
  asset: USDPricedPoolAsset,
  amount: number,
  address: string,
  withdrawError: string,
) => {
  const cToken = asset.cToken;
  const sdk = cToken.sdk;

  const amountBN = sdk.web3.utils.toBN(
    Number(amount * 10 ** asset.underlyingDecimals.toNumber()).toFixed(0),
  );
  const txObj = await testForCTokenErrorAndSend(
    cToken.contract.methods.redeemUnderlying(amountBN),
    address,
    withdrawError,
    sdk,
  );
  return txObj;
};

export const borrow = async (
  asset: USDPricedPoolAsset,
  amount: number,
  address: string,
  borrowError: string,
) => {
  const cToken = asset.cToken;
  const sdk = cToken.sdk;

  const amountBN = sdk.web3.utils.toBN(
    Number(amount * 10 ** asset.underlyingDecimals.toNumber()).toFixed(0),
  );

  const txObj = await testForCTokenErrorAndSend(
    cToken.contract.methods.borrow(amountBN),
    address,
    borrowError,
    sdk,
  );
  return txObj;
};
