chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'download_data') {
    const jsonStr = JSON.stringify(message.data, null, 2);
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `telegram_analytics_${timestamp}.json`;
    chrome.downloads.download({ url: dataUrl, filename, saveAs: false }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ status: 'error', error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ status: 'downloading', downloadId });
      }
    });
    return true;
  }

  if (message.type === 'download_report') {
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(message.html);
    chrome.downloads.download({ url: dataUrl, filename: message.filename, saveAs: false }, () => {
      sendResponse({ status: 'ok' });
    });
    return true;
  }

  return false;
});
