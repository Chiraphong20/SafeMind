const fs = require('fs');
const js = fs.readFileSync('backend_frontend.js', 'utf8');

const matches = js.matchAll(/.{0,150}tmbpart.{0,150}/g);
for (const match of matches) {
    console.log("MATCH:", match[0]);
}

const reg = js.matchAll(/.{0,150}\/register.{0,150}/g);
for (const match of reg) {
    console.log("REGISTER:", match[0]);
}
