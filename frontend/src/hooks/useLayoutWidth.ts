import { useLocation } from "react-router-dom";
import { layoutWidthForPath } from "../constants/layout";

export function useLayoutWidth(): string {
  const { pathname } = useLocation();
  return layoutWidthForPath(pathname);
}
