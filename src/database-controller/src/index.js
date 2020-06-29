var { openpaidbsdk } = require('openpaidbsdk');


function main() {
  console.log('ok', openpaidbsdk, new Date());
  setTimeout(main, 1000);
}

main()