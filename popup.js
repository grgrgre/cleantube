document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const topic = document.getElementById('topicInput').value.trim();
  
  chrome.storage.local.set({ apiKey, allowedTopic: topic }, () => {
    alert('Settings saved! Please refresh your YouTube tab.');
  });
});

chrome.storage.local.get(['apiKey', 'allowedTopic'], (res) => {
  if (res.apiKey) document.getElementById('apiKeyInput').value = res.apiKey;
  if (res.allowedTopic) document.getElementById('topicInput').value = res.allowedTopic;
});