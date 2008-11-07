/**
 * Extend the String function with trim options
 */ 
if (!String.prototype.trim) {
 String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g,"");
 }
}
if (!String.prototype.ltrim) {
 String.prototype.ltrim = function() {
  return this.replace(/^\s+/,"");
 }
}
if (!String.prototype.rtrim) {
 String.prototype.rtrim = function() {
   return this.replace(/\s+$/,"");
 }
}
