chrome.runtime.sendMessage(
    {'type': 'getRequestedUrls'},
    function generateList(response) {
      
      var section = d3.select("section") //existing section

      var ol = section.append("ol") //lets add our ordered list

      var olJoin = ol.selectAll("ol") // now we need to have a data join

      var olUpdate = olJoin.data(response.result) // we join data to the selection

      //since our selection is empty let's update it
      var p = olUpdate.enter().append("li").append("p")

      p.append("em").text(function(d, i) { return i + 1 })
      p.append("code").text(function(d) { return d.url })
      p.append("text").text(function(d){ return chrome.i18n.getMessage('navigationDescription', [d.numRequests, d.average])})

    });
