// the following is a global, singleton class
// Init by calling Ext.ux.ErrorHandler.init();
Ext.ux.ErrorHandler = function() {
  return {
    init: function() {
      window.onerror = !window.onerror ? ErrorHandler.handleError : window.onerror.createSequence(ErrorHandler.handleError);
    },
    getFormattedMessage: function(args) {
      var lines = ["The following error has occured:"];
      if (args[0] instanceof Error) { // Error object thrown in try...catch
        var err = args[0];
        lines[lines.length] = "Message: (" + err.name + ") " + err.message;
        lines[lines.length] = "Error number: " + (err.number & 0xFFFF); //Apply binary arithmetic for IE number, firefox returns message string in element array element 0
        lines[lines.length] = "Description: " + err.description;
      } else if ((args.length == 3) && (typeof(args[2]) == "number")) { // Check the signature for a match with an unhandled exception
        lines[lines.length] = "Message: " + args[0];
        lines[lines.length] = "URL: " + args[1];
        lines[lines.length] = "Line Number: " + args[2];
      } else {
        lines = ["An unknown error has occured."]; // purposely rebuild lines
        lines[lines.length] = "The following information may be useful:"
        for (var x = 0; x < args.length; x++) {
          lines[lines.length] = Ext.encode(args[x]);
        }
      }
      return lines.join("\n");
    },
    displayError: function(args) {
      // purposely creating a new window for each exception (to handle concurrent exceptions)
      var errWindow = new Ext.Window({
        autoScroll: true,
        bodyStyle: {padding: 5},
        height: 150,
        html: this.getFormattedMessage(args).replace(/\n/g, "<br />").replace(/\t/g, " &nbsp; &nbsp;"),
        modal: true,
        title: "An error has occurred",
        width: 400
      });
      errWindow.show();
    },
    logToServer: function(args) {
      Ext.Ajax.request({
        params: {
          a: "PostErrorInfo",
          error: Ext.encode(args)
        },
        url: "Default.aspx"
      });
    },
    handleError:  function() {
      var args = [];
      for (var x = 0; x < arguments.length; x++) {
        args[x] = arguments[x];
      }
      try {
        this.displayError(args);
        this.logToServer(args);
      } catch(e) {
        // if the errorHandler is broken, let the user see the browser's error handler
        return false;
      }
      return true;
    }
  };
}();
// the following line ensures that the handleError method always executes in the scope of ErrorHandler
Ext.ux.ErrorHandler.handleError = Ext.ux.ErrorHandler.handleError.createDelegate(Ext.ux.ErrorHandler);