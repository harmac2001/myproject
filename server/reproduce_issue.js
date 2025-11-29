const fetch = require('node-fetch');

async function reproduce() {
    const payload = {
        "incident_date": "2025-11-29",
        "status": "OPEN",
        "description": "Test Fix ID Return",
        "ship_id": "16193",
        "member_id": "6",
        "owner_id": "6",
        "club_id": "2",
        "handler_id": "34",
        "local_office_id": "2",
        "type_id": "78",
        "reporter_id": "1",
        "local_agent_id": "2",
        "place_id": "613",
        "closing_date": "",
        "estimated_disposal_date": "",
        "berthing_date": "2025-11-29",
        "voyage_and_leg": "",
        "club_reference": "",
        "reporting_date": "2025-11-29",
        "time_bar_date": "2026-11-29",
        "latest_report_date": "",
        "next_review_date": "2025-11-30"
    };

    try {
        const response = await fetch('http://localhost:5000/api/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log('Create Status:', response.status);
        console.log('Create Response:', text);

        if (response.ok) {
            const json = JSON.parse(text);
            if (json.id) {
                console.log(`Incident created with ID: ${json.id}`);

                // Wait a bit
                await new Promise(resolve => setTimeout(resolve, 1000));

                console.log(`Fetching incident ${json.id}...`);
                const getRes = await fetch(`http://localhost:5000/api/incidents/${json.id}`);
                const getText = await getRes.text();
                console.log('Get Status:', getRes.status);
                console.log('Get Response:', getText);
            } else {
                console.error('No ID returned in create response!');
            }
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

reproduce();
