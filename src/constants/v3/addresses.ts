import { ChainId } from '@uniswap/sdk';
import { Token } from '@uniswap/sdk-core';
import { Matic } from 'v3lib/entities/matic';
import { WMATIC } from 'v3lib/entities/wmatic';

type AddressMap = { [chainId: number]: string };

export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  [ChainId.MATIC]: '0x8C1EB1e5325049B412B7E71337116BEF88a29b3A',
};

export const POOL_DEPLOYER_ADDRESS: AddressMap = {
  [ChainId.MATIC]: '0x218a510d4d6aEA897961ab6Deb74443521A88839',
};

export const QUOTER_ADDRESSES: AddressMap = {
  [ChainId.MATIC]: '0xAaaCfe8F51B8baA4286ea97ddF145e946d5e7f46',
};

export const SWAP_ROUTER_ADDRESSES: AddressMap = {
  [ChainId.MATIC]: '0x89D6B81A1Ef25894620D05ba843d83B0A296239e',
};

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = {
  [ChainId.MATIC]: '0xe8bbDE0e17301EF1B9b1992CBfB1c9B2C2deDc97',
};

export const MULTICALL_ADDRESS: AddressMap = {
  [ChainId.MATIC]: '0x672b95814Ee72A167635291d7ac6a5f5Fd3B43AC',
};

export const V3_MIGRATOR_ADDRESSES: AddressMap = {
  [ChainId.MATIC]: '0x3bbFb3299f6685d1bfB1267b5F4DC045b28409E2',
};

export const REAL_STAKER_ADDRESS: AddressMap = {
  [ChainId.MATIC]: '0x32CFF674763b06B983C0D55Ef2e41B84D16855bb',
};

export const FINITE_FARMING: AddressMap = {
  [ChainId.MATIC]: '0xc247f1082c1487FF35E9b36634bBF3967a85E408',
};

export const INFINITE_FARMING_ADDRESS: AddressMap = {
  [ChainId.MATIC]: '0xb894E1c0d61FbF7eaf4056dFadcDe720D46B71e2',
};

export const FARMING_CENTER: AddressMap = {
  [ChainId.MATIC]: '0x258EE55b7E5B8890117cBf444b9cF4ed53688651',
};

export const V2_FACTORY_ADDRESSES: AddressMap = {
  [ChainId.MATIC]: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
};

export const V2_ROUTER_ADDRESS: AddressMap = {
  [ChainId.MATIC]: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
};

export const ENS_REGISTRAR_ADDRESSES: AddressMap = {
  [ChainId.MATIC]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
};

export const SOCKS_CONTROLLER_ADDRESSES: AddressMap = {
  [ChainId.MATIC]: '0x65770b5283117639760beA3F867b69b3697a91dd',
};

export const WMATIC_EXTENDED: { [chainId: number]: Token } = {
  ...WMATIC,
};

export class ExtendedEther extends Matic {
  private static _cachedEther: { [chainId: number]: ExtendedEther } = {};

  public get wrapped(): Token {
    if (this.chainId in WMATIC_EXTENDED) return WMATIC_EXTENDED[this.chainId];
    throw new Error('Unsupported chain ID');
  }

  public static onChain(chainId: number): ExtendedEther {
    return (
      this._cachedEther[chainId] ??
      (this._cachedEther[chainId] = new ExtendedEther(chainId))
    );
  }
}
