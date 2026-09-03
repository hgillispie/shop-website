"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Handoff = {
  bike: string;
  sendToBooking: (bike: string) => void;
};

const HandoffContext = createContext<Handoff | null>(null);

export function BookingHandoffProvider({ children }: { children: ReactNode }) {
  const [bike, setBike] = useState("");

  const sendToBooking = useCallback((value: string) => {
    setBike(value);
    document
      .getElementById("book")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const value = useMemo(() => ({ bike, sendToBooking }), [bike, sendToBooking]);

  return (
    <HandoffContext.Provider value={value}>{children}</HandoffContext.Provider>
  );
}

export function useBookingHandoff(): Handoff {
  const ctx = useContext(HandoffContext);
  if (!ctx) {
    throw new Error("useBookingHandoff must be used inside BookingHandoffProvider");
  }
  return ctx;
}
