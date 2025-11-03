export interface IPermission {
  path: string;
  name: string;
  access: string[];
}

export interface IPageProps<T> {
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  filters: { key: string; value: any }[];
  data: T[];
}
