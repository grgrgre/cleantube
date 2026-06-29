let isProcessing = false;
let videoCounter = 0;

function scanAndFilter() {
  if (isProcessing) return;

  chrome.storage.local.get(['allowedTopic'], (res) => {
    const topic = res.allowedTopic;
    if (!topic) return; 

    // Targets YouTube desktop grid & list rendering cards
    const videoElements = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer');
    const batchToSend = [];

    videoElements.forEach(video => {
      if (video.dataset.shieldProcessed) return;

      const titleElement = video.querySelector('#video-title');
      if (!titleElement) return;

      videoCounter++;
      const currentId = `clean-vid-${videoCounter}`;
      video.dataset.shieldId = currentId;
      video.dataset.shieldProcessed = "pending"; 

      batchToSend.push({
        id: currentId,
        title: titleElement.textContent.trim()
      });
    });

    if (batchToSend.length > 0) {
      isProcessing = true;

      chrome.runtime.sendMessage({ 
        action: "filterBatch", 
        videos: batchToSend, 
        topic: topic 
      }, (response) => {
        isProcessing = false;

        if (response && response.success) {
          response.results.forEach(item => {
            const el = document.querySelector(`[data-shield-id="${item.id}"]`);
            if (el) {
              if (item.status === "BLOCK") {
                el.style.display = 'none';
              }
              el.dataset.shieldProcessed = "true"; 
            }
          });
        } else {
          // Fallback if the API fails, resets elements for another attempt
          batchToSend.forEach(item => {
            const el = document.querySelector(`[data-shield-id="${item.id}"]`);
            if (el) el.removeAttribute('data-shield-processed');
          });
        }
      });
    }
  });
}

// Observes new videos being injected down the DOM tree on scroll
const observer = new MutationObserver(() => scanAndFilter());
observer.observe(document.body, { childList: true, subtree: true });