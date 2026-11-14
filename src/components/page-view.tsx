"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Records one analytics event when the page it sits on is opened. Renders nothing. */
export function PricePageView() {
  useEffect(() => {
    track({ name: "price_page_view" });
  }, []);
  return null;
}
