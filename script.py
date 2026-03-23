import requests
import json
from collections import defaultdict

# 1. Login to get token
url_token = "http://210.246.215.95:8000/token"
data = {
    "username": "admin99",
    "password": "admin99",
}

response = requests.post(url_token, data=data)
if response.status_code != 200:
    print(f"Failed to get token: {response.text}")
    exit(1)

token = response.json()["access_token"]

# 2. Get smi_v data
url_smi = "http://210.246.215.95:8000/smi-v?limit=500"
headers = {"Authorization": f"Bearer {token}"}
response_smi = requests.get(url_smi, headers=headers)

if response_smi.status_code != 200:
    print(f"Failed to get smi-v data: {response_smi.text}")
    exit(1)

items = response_smi.json().get("items", [])

# 3. Aggregate by result color
colors = defaultdict(list)

# get all patients to map hn to name
response_pts = requests.get("http://210.246.215.95:8000/patients?limit=1000", headers=headers)
hn_to_name = {}
if response_pts.status_code == 200:
    pts = response_pts.json().get("items", [])
    for p in pts:
        hn_to_name[p['hn']] = p['pt_name']

for item in items:
    color = item.get("result", "ไม่ระบุสี")
    hn = item.get("hn")
    name = hn_to_name.get(hn, f"HN: {hn}")
    
    # Avoid duplicate names in the same color if patient has multiple records
    if name not in colors[color]:
        colors[color].append(name)

# 4. Formulate the message
message_lines = ["\ud83d\udcca สรุปแจ้งเตือนอาการผู้ป่วยด้วยเครื่องมือ SMI-V\n"]
for color in ["สีแดง", "สีเหลือง", "สีเขียว", "สีอื่นๆ", "ไม่ระบุสี"]:
    matching_colors = [c for c in colors.keys() if (color in (c or "") or (color=="สีอื่นๆ" and c and c not in ["สีแดง", "สีเหลือง", "สีเขียว"]) or (color=="ไม่ระบุสี" and not c))]
    
    patients = []
    for c in matching_colors:
        patients.extend(colors[c])
        
    if not patients:
        continue
        
    icon = "\ud83d\udd34" if "แดง" in color else "\ud83d\udfe1" if "เหลือง" in color else "\ud83d\udfe2" if "เขียว" in color else "\u26aa"
    message_lines.append(f"{icon} กลุ่ม {color} - รวม {len(patients)} คน")
    for name in patients:
        message_lines.append(f" - {name}")
    message_lines.append("")

final_msg = "\n".join(message_lines)
print("\n--- MESSAGE GENERATED START ---\n")
print(final_msg)
print("\n--- MESSAGE GENERATED END ---\n")

# If you have channel access token, send to LINE
import sys
if len(sys.argv) > 1:
    line_token = sys.argv[1]
    url_line = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {line_token}"
    }
    data = {
        "to": "U0d2bdbd002e3e481dcc09363fd1f97b4",
        "messages": [
            {
                "type": "text",
                "text": final_msg.strip()
            }
        ]
    }
    resp = requests.post(url_line, headers=headers, json=data)
    print("LINE API Response:", resp.status_code, resp.text)
