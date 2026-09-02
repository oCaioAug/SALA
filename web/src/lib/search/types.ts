export type SearchResultType = "rooms" | "sectors" | "users" | "items";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: SearchResultType;
};

export type SearchResultGroup = {
  type: SearchResultType;
  items: SearchResultItem[];
};

export type SearchApiResponse = {
  groups: SearchResultGroup[];
};
