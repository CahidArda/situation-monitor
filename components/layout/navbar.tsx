export type NavItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "news", label: "News" },
  { id: "market", label: "Market", disabled: true },
  { id: "portfolio", label: "Portfolio", disabled: true },
  { id: "dms", label: "DMs" },
];
