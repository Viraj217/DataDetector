export type TodayStackParamList = {
  TodayHome: undefined;
  AppDetail: { packageName: string; appName?: string };
};

export type HistoryStackParamList = {
  HistoryHome: undefined;
  DayDetail: { date: string };
  AppDetail: { packageName: string; appName?: string };
};

export type AppsStackParamList = {
  AppsHome: undefined;
  AppDetail: { packageName: string; appName?: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
};
