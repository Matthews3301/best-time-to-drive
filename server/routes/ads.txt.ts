import { ADSENSE_CLIENT } from '../../utils/adsense';

export default defineEventHandler((event) => {
  const publisherId = ADSENSE_CLIENT.replace(/^ca-/, '');
  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
});
