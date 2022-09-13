import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit';
import { FarmListInfo } from 'types';

export const fetchCntFarmList: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string }>;
  fulfilled: ActionCreatorWithPayload<{
    url: string;
    farmList: any;
    requestId: string;
  }>;
  rejected: ActionCreatorWithPayload<{
    url: string;
    errorMessage: string;
    requestId: string;
  }>;
}> = {
  pending: createAction('lists/fetchCntFarmList/pending'),
  fulfilled: createAction('lists/fetchCntFarmList/fulfilled'),
  rejected: createAction('lists/fetchCntFarmList/rejected'),
};

export const acceptCntFarmUpdate = createAction<string>(
  'lists/acceptCntFarmListUpdate',
);
