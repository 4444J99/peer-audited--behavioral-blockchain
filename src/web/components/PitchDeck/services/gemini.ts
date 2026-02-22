export const callGemini = async (prompt: string, isJson: boolean = false): Promise<string> => {
  // Switched to Pollinations.ai free open-source endpoint to bypass 403 errors and API key requirements.
  const url = `https://text.pollinations.ai/`;

  const systemPrompt = "You are an elite Y-Combinator level startup advisor and venture capitalist." + 
                      (isJson ? " Respond ONLY with valid JSON exactly as requested. Do not include markdown formatting or backticks around the JSON." : "");

  // Pollinations.ai supports OpenAI message array format via POST
  const payload: any = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    model: "openai"
  };

  if (isJson) {
     payload.jsonMode = true; // Many open endpoints support this flag to force JSON
  }

  const fetchWithRetry = async (retries = 3, delay = 1000): Promise<string> => {
    try {
      const response = await fetch(url + (isJson ? "?jsonMode=true" : ""), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      let data = await response.text();
      
      // Filter out Pollinations warning logs
      if (data.includes("⚠️ **IMPORTANT NOTICE** ⚠️")) {
        const warningString = "⚠️ **IMPORTANT NOTICE** ⚠️ The Pollinations legacy text API is being deprecated for **authenticated users**. Please migrate to our new service at https://enter.pollinations.ai for better performance and access to all the latest models. Note: Anonymous requests to text.pollinations.ai are NOT affected and will continue to work normally.";
        data = data.replace(warningString, "").trim();
      }

      if (isJson) {
         // Attempt to extract purely JSON objects/arrays to guarantee parser safety
         const jsonMatch = data.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
         if (jsonMatch) {
             data = jsonMatch[0];
         }
      }
      
      return data;
    } catch (error) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(retries - 1, delay * 2);
      } else {
        throw error;
      }
    }
  };

  return await fetchWithRetry();
};
