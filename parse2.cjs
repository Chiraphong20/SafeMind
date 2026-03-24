const fs = require('fs');
const raw = fs.readFileSync('openapi.json', 'utf8');
const openapi = JSON.parse(raw);

const endpoint = openapi.paths['/smi-v'].get;
console.log(JSON.stringify(endpoint.parameters, null, 2));
