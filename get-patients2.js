import axios from 'axios';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzI1NjY5LCJleHAiOjE3NzQzMjc0Njl9.0uflMog9ZCHejca0HXvKuF-dVL-84u3zNt6PYTWPxTY";
const BASE_URL = "http://210.246.215.95:8000/patients";

async function checkPatients() {
    try {
        // Fetch up to 500 patients to ensure we find any new ones at the end
        const res = await axios.get(`${BASE_URL}?limit=500`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        
        const items = res.data.items || res.data;
        const targetHNs = ["HN001", "HN002", "HN003", "HN004", "HN005", "HN006", "HN007", "HN008", "HN009"];
        
        console.log(`Checking ${items.length} total patients for new mockups...`);
        const found = items.filter(p => targetHNs.includes(p.hn));
        
        if (found.length > 0) {
            console.log("FOUND YOU!");
            found.forEach(p => console.log(`- ${p.hn}: ${p.pt_name}`));
        } else {
            console.log("None of the mock HNs (HN001-HN009) exist in the database yet.");
            // Just print the newest 5 to see what changed recently
            console.log("Here are the last 5 patients in DB:");
            items.slice(-5).forEach(p => console.log(`- ${p.hn}: ${p.pt_name}`));
        }

    } catch (e) {
        console.error("API error:", e.response?.status, e.response?.data || e.message);
    }
}
checkPatients();
