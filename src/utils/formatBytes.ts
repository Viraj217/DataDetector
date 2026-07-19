export interface FormattedBytes {
  value: string;
  unit: string;
  full: string;
}

export const formatBytes = (bytes: number, decimals: number = 1): FormattedBytes => {
  if (bytes === 0) {
    return { value: '0', unit: 'B', full: '0 B' };
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // If it's Bytes, use 0 decimals, otherwise use the specified decimals (default 1)
  const dm = sizes[i] === 'B' ? 0 : (decimals < 0 ? 0 : decimals);
  
  const valNum = bytes / Math.pow(k, i);
  const valStr = valNum.toFixed(dm);

  return {
    value: valStr,
    unit: sizes[i],
    full: `${valStr} ${sizes[i]}`,
  };
};
