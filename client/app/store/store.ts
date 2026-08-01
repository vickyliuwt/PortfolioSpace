// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import accountReducer from "./accountReducer";
import followReducer from "./followReducer";

export const store = configureStore({
  reducer: {
    account: accountReducer,
    follow: followReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
