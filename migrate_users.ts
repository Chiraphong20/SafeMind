import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    try {
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS id_card VARCHAR(20),
            ADD COLUMN IF NOT EXISTS note TEXT,
            ADD COLUMN IF NOT EXISTS subdistrict VARCHAR(255),
            ADD COLUMN IF NOT EXISTS village VARCHAR(255),
            ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS police_station VARCHAR(255);
        `;
        console.log("Migration successful");
    } catch(e) {
        console.error("Migration failed:", e);
    }
}
main();
