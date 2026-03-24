import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log("Altering users table to add FastAPI columns...");
    try {
        await sql`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS thai_id VARCHAR(20),
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
            ADD COLUMN IF NOT EXISTS is_kyc_verified VARCHAR(10),
            ADD COLUMN IF NOT EXISTS role_id INT,
            ADD COLUMN IF NOT EXISTS line_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS remark TEXT,
            ADD COLUMN IF NOT EXISTS register_type INT,
            ADD COLUMN IF NOT EXISTS addressid VARCHAR(50),
            ADD COLUMN IF NOT EXISTS chwpart VARCHAR(255),
            ADD COLUMN IF NOT EXISTS amppart VARCHAR(255),
            ADD COLUMN IF NOT EXISTS tmbpart VARCHAR(255),
            ADD COLUMN IF NOT EXISTS moopart VARCHAR(255),
            ADD COLUMN IF NOT EXISTS police_station_id INT,
            ADD COLUMN IF NOT EXISTS health_center_id INT;
        `;
        console.log("Migration successful");
    } catch(e) {
        console.error("Migration failed:", e);
    }
}
main();
