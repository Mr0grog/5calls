import { ApplicationState } from './root';
import { routerReducer, RouterState } from 'react-router-redux';
import { Reducer, combineReducers } from 'redux';
import { LocationState, locationStateReducer } from './location/reducer';
import { CallState, callStateReducer } from './callState/reducer';
import { RemoteDataState, remoteDataReducer } from './remoteData/reducer';
import { UserStatsState, userStatsReducer } from './userStats/reducer';

export type OutcomeType =
  'unavailable' |
  'voice_mail' |
  'made_contact' |
  'skip'
  ;

export interface ApplicationState {
  remoteDataState: RemoteDataState;
  callState: CallState;
  locationState: LocationState;
  userStatsState: UserStatsState;
}

export const DefaultApplicationState: ApplicationState = {
  remoteDataState: {} as RemoteDataState,
  callState: {} as CallState,
  locationState: {} as LocationState,
  userStatsState: {} as UserStatsState,
};

// DANGER: TypeScript magic ahead!!
// These articles should help your understanding of this section:
// https://blog.mariusschulz.com/2017/01/06/typescript-2-1-keyof-and-lookup-types
// https://blog.mariusschulz.com/2017/01/20/typescript-2-1-mapped-types
// https://moin.world/2017/06/18/10-TypeScript-Features-You-Might-Not-Know/
//
// This will be used by redux-persist in store.ts
// A type that is an ApplicationState key
export type ApplicationStateKeyType = keyof ApplicationState;
// A TS mapped type to type out an object shape that represents
// all ApplicationState keys and their string equivalents.
type ApplicationStateKeyTypes = {[K in ApplicationStateKeyType]: ApplicationStateKeyType };
// Object that maps out all possible ApplicationState keys
export const ApplicationStateKey: ApplicationStateKeyTypes = {
  locationState: 'locationState',
  remoteDataState: 'remoteDataState',
  callState: 'callState',
  userStatsState: 'userStatsState',
};

const rootReducer = combineReducers({
  routing: routerReducer as Reducer<RouterState>,
  remoteDataState: remoteDataReducer,
  callState: callStateReducer,
  locationState: locationStateReducer,
  userStatsState: userStatsReducer,
});

export default rootReducer;
