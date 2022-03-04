/*
 * Copyright (C) 2018 Matus Zamborsky
 * This file is part of Cyano Wallet.
 *
 * Cyano Wallet is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cyano Wallet is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cyano Wallet.  If not, see <http://www.gnu.org/licenses/>.
 */
import { get } from 'lodash';
import * as React from 'react';
import { RouterProps } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { v4 as uuid } from 'uuid';
import { getWallet } from '../../../../api/authApi';
import { identitySignUp } from '../../../../api/identityApi';
import { RegisterOntIdRequest } from '../../../../redux/transactionRequests';
import { reduxConnect, withProps } from '../../../compose';
import { Actions, GlobalState } from '../../../redux';
import { getIsGte } from '../../../utils/number';
import { IdentityCreateView, Props } from './identityCreateView';

const mapStateToProps = (state: GlobalState) => ({
  loading: state.loader.loading,
  ongAmount: state.runtime.ongAmount,
  walletEncoded: state.wallet.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      addRequest: Actions.transactionRequests.addRequest,
      finishLoading: Actions.loader.finishLoading,
      setWallet: Actions.wallet.setWallet,
      startLoading: Actions.loader.startLoading,
    },
    dispatch,
  );

const enhancer = (Component: React.ComponentType<Props>) => (props: RouterProps) =>
  reduxConnect(mapStateToProps, mapDispatchToProps, (reduxProps, actions) =>
    withProps(
      {
        handleCancel: () => {
          props.history.goBack();
        },
        handleSubmit: async (values: object) => {
          const wallet = getWallet(reduxProps.walletEncoded!);

          const password = get(values, 'password', '');
          const neo: boolean = get(values, 'neo', false);

          const { encryptedWif, mnemonics, wif, identity } = identitySignUp(password, wallet.scrypt, neo);

          // todo: no type check RegisterOntIdRequest
          const requestId = uuid();
          await actions.addRequest({
            encryptedWif,
            id: requestId,
            identity: identity.toJson(),
            mnemonics,
            password,
            type: 'register_ont_id',
            wif,
          } as RegisterOntIdRequest);

          props.history.push('/confirm', {
            encryptedWif,
            mnemonics,
            redirectFail: '/identity/checkFailed',
            redirectSucess: '/identity/new',
            requestId,
            wif
          });
        },
        haveEnoughOng: getIsGte(reduxProps.ongAmount, '10000000000000000'), // >= 0.01
      },
      (injectedProps) => <Component {...injectedProps} loading={reduxProps.loading} />,
    ),
  );


export const IdentityCreate = enhancer(IdentityCreateView);
