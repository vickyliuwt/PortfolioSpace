"use client";

// Providers.tsx
// wrap app in redux + check session once on load

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { useAppDispatch } from "./store/hooks";
import { setCurrentUser } from "./store/accountReducer";
import { profile } from "./(portfolio)/Account/client";

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // ask the server who i am
    profile().then((user) => dispatch(setCurrentUser(user)));
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionBootstrap>{children}</SessionBootstrap>
    </Provider>
  );
}
