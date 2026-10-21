import { useEffect, useState } from "react";
import { fetchDomains } from "../api";
import type { DomainRead } from "../types/api";

export function useDomains() {
  const [domains, setDomains] = useState<DomainRead[]>([]);

  useEffect(() => {
    fetchDomains()
      .then(setDomains)
      .catch(() => setDomains([]));
  }, []);

  return domains;
}
