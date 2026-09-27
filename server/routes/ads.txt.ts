export default defineEventHandler((event) => {
  const client = String(useRuntimeConfig().public.adsenseClient || '');
  const publisherId = client.replace(/^ca-/, '');

  if (!publisherId.startsWith('pub-')) {
    setResponseStatus(event, 404);
    return '';
  }

  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
});
