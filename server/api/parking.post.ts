export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { destination } = body;

  if (!destination) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Destination address is required'
    });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key not configured'
    });
  }

  try {
    const prompt = `I'm driving to ${destination}. List places to park. List car parks, street parking and any other options. Include prices, times and necessary permits if you can find this.

Return your response in the following JSON format (return ONLY valid JSON, no markdown formatting or code blocks):
{
  "parkingLocations": [
    {
      "name": "string - name of the parking location",
      "category": "string - one of: Car Park, Street Parking, Garage, Lot, Other",
      "location": "string - specific address or location description",
      "paymentInfo": "string - pricing information and payment methods",
      "hours": "string - operating hours or time restrictions. Use short time formats like '9am-5pm' or '24 hours', 'Sat', 'Mon', etc.",
      "description": "string - additional details about the parking option, keep short, just the important information"
    }
  ],
  "otherInformation": "string - any additional relevant parking information, tips, or restrictions for the area. Keep short, just the important information"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate parking information for locations. Always return valid JSON without any markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw createError({
        statusCode: response.status,
        statusMessage: 'Failed to fetch parking information'
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No response from OpenAI'
      });
    }

    // Parse the JSON response from OpenAI
    let parkingData;
    try {
      // Remove any potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parkingData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to parse parking information'
      });
    }

    return {
      success: true,
      data: parkingData
    };

  } catch (error: any) {
    console.error('Error fetching parking information:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    });
  }
});

