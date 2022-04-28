export function parseDuration(durationStr) {
  const tokens = durationStr.toLowerCase().match(/[a-z]+|[0-9]+/g);
  if (tokens.length % 2 !== 0) return undefined;
  let duration = 0;
  for (let i=0; i<tokens.length; i+=2) {
    const value = parseInt(tokens[i]);
    const code = tokens[i+1];
    if (value === 0) return undefined;
    switch(code) {
      case 'h': duration += value * 3600; break;
      case 'd': duration += value * 86400; break;
      case 'w': duration += value * 86400 * 7; break;
      default: return undefined;
    }
  }
  return duration * 1000;
}

const TimeUtils = {
  parseDuration: parseDuration
}

export default TimeUtils;