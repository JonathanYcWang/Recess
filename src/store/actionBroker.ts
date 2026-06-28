import type { AnyAction, Dispatch } from '@reduxjs/toolkit';

export type ActionBroker = {
  route(action: AnyAction): AnyAction;
};

export const createActionBroker = (dispatch: Dispatch<AnyAction>): ActionBroker => ({
  route: (action) => dispatch(action),
});
