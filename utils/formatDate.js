// helpers/formatDate.js
/**
 * yyyymmdd -> yyyy-mm-dd
 */
function toDashed(dateStr) {
  return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
}

/**
 * yyyy-mm-dd -> yyyymmdd
 */
function toPlain(dateStr) {
  return dateStr.replace(/-/g, '');
}

module.exports = { toDashed, toPlain };
