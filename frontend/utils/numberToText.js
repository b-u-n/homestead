/**
 * Convert numbers 0-10 to their text representation
 */
const numberToText = (num) => {
  const words = [
    'zero', 'one', 'two', 'three', 'four',
    'five', 'six', 'seven', 'eight', 'nine', 'ten'
  ];

  if (num >= 0 && num <= 10) {
    return words[num];
  }

  return num.toString();
};

export default numberToText;
