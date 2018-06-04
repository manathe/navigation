alert("Hello from your Chrome extension!");

var iframe = document.createElement("iframe");  
iframe.src = "index.html";  
iframe.width = "800px";  
//Add the element to the current page
document.body.appendChild(iframe);