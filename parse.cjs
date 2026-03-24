const fs = require('fs');

const raw = fs.readFileSync('openapi.json', 'utf8');
const openapi = JSON.parse(raw);

// The user mentioned "/patients/create_patient_patients_post", which uses a schema
const schema = openapi.paths['/patients'].post;
console.log("POST /patients Endpoint Schema:");
if (schema.requestBody) {
    const ref = schema.requestBody.content['application/json'].schema.$ref;
    const schemaName = ref.split('/').pop();
    console.log(JSON.stringify(openapi.components.schemas[schemaName], null, 2));
} else {
    console.log("No requestBody defined.");
}
