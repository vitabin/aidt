export function formatDateToKoreanString(date: Date) {
  // Define the options for the date part
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  // Use Intl.DateTimeFormat for the date part
  const dateFormatter = new Intl.DateTimeFormat('ko-KR', dateOptions);
  const formattedDate = dateFormatter.format(date);

  // Extract milliseconds and append to the formatted date
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
  return `${formattedDate}.${milliseconds}`;
}
