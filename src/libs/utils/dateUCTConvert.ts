function convertToKoreanTime(date: Date): Date {
  const koreanTimeOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로 변환
  return new Date(date.getTime() + koreanTimeOffset);
}

export function convertUTC9Date(inputDate?: Date) {
  const now = inputDate ? new Date(inputDate) : new Date();

  return convertToKoreanTime(now);
}
