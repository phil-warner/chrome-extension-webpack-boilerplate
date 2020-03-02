// extension background event handler
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request.cmd == "get-clip-dialog") {
        $.ajax({
            url: chrome.extension.getURL("html/clip-dialog.html"),
            dataType: "html",
            success: sendResponse
        });
    }
})
