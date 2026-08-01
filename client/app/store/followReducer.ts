// store/followReducer.ts
// follow ids

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FollowState {
  ids: string[];
  loaded: boolean;
}

const initialState: FollowState = { ids: [], loaded: false };

const followSlice = createSlice({
  name: "follow",
  initialState,
  reducers: {
    setFollowing(state, action: PayloadAction<string[]>) {
      state.ids = action.payload;
      state.loaded = true;
    },
    addFollow(state, action: PayloadAction<string>) {
      if (!state.ids.includes(action.payload)) state.ids.push(action.payload);
    },
    removeFollow(state, action: PayloadAction<string>) {
      state.ids = state.ids.filter((id) => id !== action.payload);
    },
    clearFollowing(state) {
      state.ids = [];
      state.loaded = false;
    },
  },
});

export const { setFollowing, addFollow, removeFollow, clearFollowing } = followSlice.actions;
export default followSlice.reducer;
