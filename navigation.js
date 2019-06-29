chrome.runtime.sendMessage(
    {'type': 'getRequestedUrls'},
    function generateList(response) {
      var section = document.querySelector('body>section');
      var results = response.result;
      var ol = document.createElement('ol');
      var li, p, em, code, text;
      var i;
      for (i = 0; i < results.length; i++ ) {
        li = document.createElement('li');
        p = document.createElement('p');
        em = document.createElement('em');
        em.textContent = i + 1;
        code = document.createElement('code');
        code.textContent = results[i].url;
        text = document.createTextNode(
          chrome.i18n.getMessage('navigationDescription',
            [results[i].numRequests,
            results[i].average]));
        p.appendChild(em);
        p.appendChild(code);
        p.appendChild(text);
        li.appendChild(p);
        ol.appendChild(li);
      }
      section.innerHTML = '';
      section.appendChild(ol);
    });
