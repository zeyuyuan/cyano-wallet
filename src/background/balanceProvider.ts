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
import { TokenAmountState } from 'src/redux/runtime';
import { getAddress } from '../api/accountApi';
import Actions from '../redux/actions';
import { GlobalStore } from '../redux/state';
import { getTransferList } from './api/explorerApi';
import { getBalance, getUnboundOng } from './api/runtimeApi';
import { getTokenBalanceOwn } from './api/tokenApi';

export async function refreshBalance(store: GlobalStore) {
  const state = store.getState();
  const walletEncoded = state.wallet.wallet;
  const tokens = state.settings.tokens;

  if (walletEncoded !== null) {
    try {
      const balance = await getBalance();
      const unboundOng = await getUnboundOng();

      const tokenBalances: TokenAmountState[] = [];

      for (const token of tokens) {
        try {
          const amount = await getTokenBalanceOwn(token.contract, token.vmType);
          tokenBalances.push({ contract: token.contract, amount });
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.warn('Failed to load balance of token: ', token.contract);
        }
      }

      store.dispatch(Actions.runtime.setBalance(balance.ong, balance.ont, unboundOng, '0', tokenBalances));

      const address = getAddress(walletEncoded);

      const transfers = await getTransferList(address);

      store.dispatch(Actions.runtime.setTransfers(transfers));
    } catch (e) {
      // ignore
    }
  }
}

export function initBalanceProvider(store: GlobalStore) {
  window.setInterval(async () => {
    refreshBalance(store);
  }, 15000);
}
