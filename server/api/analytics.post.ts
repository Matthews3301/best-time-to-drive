export default defineLazyEventHandler(async () => {

  return defineEventHandler(async (event: any) => {
    const body = JSON.parse(await readBody(event));
    const { sessionUuid } = body;
    // const analyticsUrl = 'https://api.retool.com/v1/workflows/xxxxx/startTrigger';
    try {
      /* await fetch(analyticsUrl, {
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
      }); */
    } catch (error) {
      console.error('Error saving data to analytics:', error);
    }
  });
});
