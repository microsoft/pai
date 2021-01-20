import { combineReducers } from 'redux';
import { global } from './global';
import { jobInformation } from './job-information';

export default combineReducers({ global, jobInformation });
