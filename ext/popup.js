document.addEventListener('DOMContentLoaded', () => {
  const filterInput = document.getElementById('filterInput');
  
  // Load the saved filter value
  chrome.storage.local.get(['filterValue'], (result) => {
    if (result.filterValue) {
      filterInput.value = result.filterValue;
    }
  });

  // Get initial page info
  getPageInfo();
});

document.getElementById('scrapeButton').addEventListener('click', () => {
  const filterValue = document.getElementById('filterInput').value.trim();

  // Save the filter value
  chrome.storage.local.set({ filterValue: filterValue });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'scrape', filter: filterValue }, (response) => {
      if (response && response.data) {
        navigator.clipboard.writeText(response.data);
      } else if (response && response.error) {
        alert(response.error);
      } else {
        alert('No data received from the content script.');
      }
    });
  });
});

document.getElementById('prevButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'prevPage' }, () => {
      setTimeout(getPageInfo, 500); // Wait for page to update
    });
  });
});

document.getElementById('nextButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'nextPage' }, () => {
      setTimeout(getPageInfo, 500); // Wait for page to update
    });
  });
});

function getPageInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageInfo' }, (response) => {
      if (response && response.pageInfo) {
        document.getElementById('pageInfo').innerText = response.pageInfo;
      }
    });
  });
}
