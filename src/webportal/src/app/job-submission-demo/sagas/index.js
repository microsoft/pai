// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { call, put, takeEvery } from 'redux-saga/effects';
import { listHivedSkuTypes, listUserVirtualClusters } from '../utils/conn';

function* fetchVirtualClusters({ payload }) {
  try {
    const response = yield call(listUserVirtualClusters, payload.loginUser);
    yield put({
      type: 'SAVE_VIRTUAL_CLUSTERS',
      payload: response,
    });
  } catch (e) {
    alert(e.message);
  }
}

function* fetchHivedSkuTypes({ payload }) {
  try {
    const response = yield call(listHivedSkuTypes, payload.virtualCluster);
    yield put({
      type: 'SAVE_HIVEDSKUTYPES',
      payload: response,
    });
  } catch (e) {
    alert(e.message);
  }
}

export default function* rootEffects() {
  yield takeEvery('fetchVirtualClusters', fetchVirtualClusters);
  yield takeEvery('fetchHivedSkuTypes', fetchHivedSkuTypes);
}
