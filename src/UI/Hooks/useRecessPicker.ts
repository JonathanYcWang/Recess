import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { sendAppAction } from '../../Shared/ActionBrokers/ActionBroker';
import { APP_ACTION } from '../../Shared/Constants/Constants';
import { Reward } from '@/Shared/Types/AppState';
import {
  selectRecessOptions,
  selectRecessPickerRerolls,
  selectSelectedRecess,
} from '../Redux/Selectors/index';

export const useRecessPicker = () => {
  const recessOptions = useSelector(selectRecessOptions);
  const rerolls = useSelector(selectRecessPickerRerolls);
  const selectedRecess = useSelector(selectSelectedRecess);

  const selectRecess = useCallback((recess: Reward) => {
    void sendAppAction({ type: APP_ACTION.RECESS_PICKER_SELECT_RECESS, recess });
  }, []);

  const rerollRecessOption = useCallback(
    (index: number) => {
      if (rerolls > 0) {
        void sendAppAction({ type: APP_ACTION.RECESS_PICKER_REROLL, index });
      }
    },
    [rerolls]
  );

  return {
    recessOptions,
    rerolls,
    selectedRecess,
    selectRecess,
    rerollRecessOption,
  };
};
