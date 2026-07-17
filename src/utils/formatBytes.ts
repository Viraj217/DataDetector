export interface FormattedBytes {
  value: string;
  unit: string;
  full: string;
}

export const formatBytes = (bytes: number, decimals: number = 2): FormattedBytes => {
  if (bytes === 0) {
    return { value: '0', unit: 'B', full: '0 B' };
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const valNum = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return {
    value: valNum.toString(),
    unit: sizes[i],
    full: `${valNum} ${sizes[i]}`,
  };
};
