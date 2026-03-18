import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    try {
        const result = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';`;
        console.log("Columns in users table:");
        console.table(result.rows);
    } catch(e) {
        console.error(e);
    }
}
main();
