chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "filterBatch") {
    analyzeBatchWithAI(request.videos, request.topic)
      .then(results => sendResponse({ success: true, results }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for asynchronous sendResponse
  }
});

async function analyzeBatchWithAI(videos, topic) {
  const store = await chrome.storage.local.get(['apiKey']);
  const apiKey = store.apiKey;
  if (!apiKey) throw new Error("Missing API Key");

  const listForAI = videos.map(v => `ID: ${v.id} | Title: "${v.title}"`).join("\n");

  const prompt = `You are a smart content filter for YouTube. The user wants to see ONLY videos that strictly match the topic: "${topic}".
Your job is to analyze the list of videos below. Filter out any content that doesn't fit the topic OR contains toxic clickbait (e.g., severe shock value, hysterical caps, dramatic gossip, zero substance).

Analyze the underlying context of the title, regardless of the language it is written in. If a video is genuinely relevant, return "ALLOW". If it is unrelated or clickbait junk, return "BLOCK".

Video list:
${listForAI}

Return your response strictly as a JSON array of objects with no other markdown wrappers or extra text:
[{"id": "video_id", "status": "ALLOW"}, {"id": "video_id", "status": "BLOCK"}]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  const data = await response.json();
  const textResponse = data.candidates[0].content.parts[0].text;
  return JSON.parse(textResponse);
}