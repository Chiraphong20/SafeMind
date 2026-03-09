import { sql } from '@vercel/postgres';
import axios from 'axios';

export default async function handler(req: any, res: any) {
    // Optional: Only allow requests from Vercel Cron or authorize via a secret token
    // Example: Vercel sends `authorization: Bearer <CRON_SECRET>`
    // For now we'll allow execution

    try {
        console.log("CRON START: Checking high-risk patients...");

        // Query: Find all patients with risk_level = 'red' 
        // who haven't had a visit in the last 7 days OR have never been visited since 7 days of creation.
        const result = await sql`
            WITH LatestVisits AS (
                SELECT patient_id, MAX(visit_date) as last_visit
                FROM home_visits
                GROUP BY patient_id
            )
            SELECT p.id, p.name, p.responsible_user_id, p.created_at, lv.last_visit
            FROM patients p
            LEFT JOIN LatestVisits lv ON p.id = lv.patient_id
            WHERE p.risk_level = 'red' AND (
                -- Case 1: Visited, but more than 7 days ago
                (lv.last_visit IS NOT NULL AND lv.last_visit < NOW() - INTERVAL '7 days')
                OR 
                -- Case 2: Never visited, and created more than 7 days ago
                (lv.last_visit IS NULL AND p.created_at < NOW() - INTERVAL '7 days')
            );
        `;

        const overduePatients = result.rows;

        if (overduePatients.length === 0) {
            console.log("No overdue high-risk patients found today.");
            return res.status(200).json({ message: "All clear! No overdue patients.", count: 0 });
        }

        console.log(`Found ${overduePatients.length} overdue high-risk patients. Sending notifications...`);

        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!lineToken) {
            throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not defined.");
        }

        let sentCount = 0;

        // Loop and send message to the responsible staff via LINE Messaging API
        for (const patient of overduePatients) {
            if (!patient.responsible_user_id) continue; // No staff assigned

            const messageText = `⚠️ แจ้งเตือน! เคสกลุ่มเสี่ยงสูง (สีแดง)\n\nคนไข้: ${patient.name}\nยังไม่ได้รับการเข้าเยี่ยมบ้าน หรือขาดการบันทึกข้อมูลเกิน 1 สัปดาห์แล้ว\n\nโปรดเข้าเยี่ยมและบันทึกข้อมูลด่วนครับ\n🔗 เก็บบันทึกการเยี่ยม: https://safe-mind-eight.vercel.app/save?patientId=${patient.id}`;

            try {
                await axios.post(
                    `https://api.line.me/v2/bot/message/push`,
                    {
                        to: patient.responsible_user_id,
                        messages: [
                            {
                                type: "text",
                                text: messageText
                            }
                        ]
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${lineToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                sentCount++;
            } catch (err: any) {
                console.error(`Failed to notify staff ${patient.responsible_user_id} for patient ${patient.id}:`, err?.response?.data || err.message);
            }
        }

        return res.status(200).json({
            message: "Push Notifications Sent Successfully",
            overdue_found: overduePatients.length,
            messages_sent: sentCount
        });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
