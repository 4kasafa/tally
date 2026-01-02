chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'scrape':
      const table = document.querySelector('.dx-datagrid-rowsview .dx-datagrid-table.dx-datagrid-table-fixed');
      if (table) {
        let data = '';
        const rows = table.querySelectorAll('tr.dx-data-row');
        const filter = request.filter;

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          const userCell = cells.length > 9 ? cells[9].innerText.trim() : '';
          
          if (!filter || userCell === filter) {
            const rowData = [];
            for (let i = 1; i < cells.length; i++) {
              rowData.push(cells[i].innerText.trim());
            }
            data += rowData.join('\t') + '\n';
          }
        });

        console.log('Tally: Extracted data:', data);
        sendResponse({ data: data });
      } else {
        sendResponse({ data: null, error: 'Could not find the specified table on this page.' });
      }
      break;

    case 'getPageInfo':
      const pageInfoElement = document.querySelector('.imk-margin-lefttopbot');
      if (pageInfoElement) {
        const filteredText = pageInfoElement.innerText
          .replace(/\bLaporan\b/gi, '')
          .trim();

        sendResponse({ pageInfo: filteredText });
      } else {
        sendResponse({ pageInfo: '' });
      }
      break;

    case 'prevPage':
      const prevButton = document.querySelector('.dx-icon-chevronleft');
      if (prevButton) {
        prevButton.click();
      }
      sendResponse({});
      break;

    case 'nextPage':
      const nextButton = document.querySelector('.dx-icon-chevronright');
      if (nextButton) {
        nextButton.click();
      }
      sendResponse({});
      break;
  }
  return true;
});

