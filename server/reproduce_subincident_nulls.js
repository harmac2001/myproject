const fetch = require('node-fetch');

async function reproduce() {
    // 1. Create a parent incident with minimal fields (NULLs where possible)
    const parentPayload = {
        "incident_date": "2025-11-29",
        "status": "OPEN",
        "description": "Test Minimal Fields",
        "ship_id": "16193",
        "member_id": "6",
        "owner_id": "6",
        "club_id": "2",
        "handler_id": "34",
        "local_office_id": "2",
        "type_id": "78",
        "reporter_id": "1", // Required now
        "local_agent_id": "2",
        "place_id": "613",
        "closing_date": "", // Should become NULL
        "estimated_disposal_date": "", // Should become NULL
        "berthing_date": "2025-11-29", // Required now
        "voyage_and_leg": "",
        "club_reference": "",
        "reporting_date": "2025-11-29",
        "time_bar_date": "", // Should become NULL
        "latest_report_date": "", // Should become NULL
        "next_review_date": "" // Should become NULL
    };

    try {
        console.log('Creating parent incident...');
        const createRes = await fetch('/api/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parentPayload)
        });

        const createText = await createRes.text();
        console.log('Create Parent Status:', createRes.status);

        if (!createRes.ok) {
            console.error('Failed to create parent:', createText);
            return;
        }

        const parentJson = JSON.parse(createText);
        const parentId = parentJson.id;
        console.log(`Parent created with ID: ${parentId}`);

        // 2. Create sub-incident from this parent
        console.log(`Attempting to create sub-incident for parent ID: ${parentId}`);
        const subRes = await fetch(`/api/incidents/${parentId}/subincident`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const subText = await subRes.text();
        console.log('Create Sub-Incident Status:', subRes.status);
        console.log('Create Sub-Incident Response:', subText);

    } catch (err) {
        console.error('Error:', err);
    }
}

reproduce();
