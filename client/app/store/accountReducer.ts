// store/accountReducer.ts
// who is logged in (shared across the app)

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Creator } from "../lib/types";

interface AccountState {
  currentUser: Creator | null;
  ready: boolean; // did we check the session yet
}

const initialState: AccountState = { currentUser: null, ready: false };

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<Creator | null>) {
      state.currentUser = action.payload;
      state.ready = true;
    },
    markReady(state) {
      state.ready = true;
    },
  },
});

export const { setCurrentUser, markReady } = accountSlice.actions;
export default accountSlice.reducer;
