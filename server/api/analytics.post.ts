export default defineLazyEventHandler(async () => {

  return defineEventHandler(async (event: any) => {
    const body = JSON.parse(await readBody(event));
    const { sessionUuid } = body;
    const analyticsUrl = 'https://api.retool.com/v1/workflows/b5c55582-095b-48c3-8b67-24bd6ac5400f/startTrigger';
    try {
      await fetch(analyticsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workflow-Api-Key': 'retool_wk_6d7b6aa6f8734973a56134548127ed60'
        },
        body: JSON.stringify({
          created_at: new Date().toISOString(),
          session_uuid: sessionUuid,
          options: body
        })
      });
    } catch (error) {
      console.error('Error saving data to analytics:', error);
    }
  });
});
