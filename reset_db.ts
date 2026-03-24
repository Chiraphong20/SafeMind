import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log("Dropping and recreating users table...");
    try {
        await sql`DROP TABLE IF EXISTS users;`;
        await sql`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255),
                password VARCHAR(255),
                full_name VARCHAR(255),
                thai_id VARCHAR(20),
                phone_number VARCHAR(20),
                is_kyc_verified VARCHAR(10),
                role_id INT,
                email VARCHAR(255),
                line_id VARCHAR(255),
                line_user_id VARCHAR(255) UNIQUE,
                remark TEXT,
                register_type INT,
                addressid VARCHAR(50),
                chwpart VARCHAR(255),
                amppart VARCHAR(255),
                tmbpart VARCHAR(255),
                moopart VARCHAR(255),
                police_station_id INT,
                health_center_id INT,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;
        console.log("Migration successful");
    } catch(e) {
        console.error("Migration failed:", e);
    }
}
main();
