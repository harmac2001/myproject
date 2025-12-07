const fetch = require('node-fetch');

async function testPost() {
    const payload = {
        incident_date: '2025-11-29',
        status: 'Open',
        description: 'Test Incident',
        ship_id: 19406,
        member_id: 12182,
        owner_id: 12182, // Assuming same as member for test
        club_id: 91,
        handler_id: 32,
        local_office_id: 1,
        type_id: 62,
        reporter_id: 10,
        local_agent_id: 628,
        place_id: 368,
        closing_date: null,
        estimated_disposal_date: null,
        berthing_date: null,
        voyage_and_leg: 'Test Voyage',
        club_reference: 'TestRef123',
        reporting_date: '2025-11-29',
        time_bar_date: null,
        latest_report_date: null,
        next_review_date: null
    };

    try {
        const response = await fetch('/api/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            console.log('Error Status:', response.status);
            console.log('Error Body:', text);
        } else {
            const data = await response.json();
            console.log('Success:', data);
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testPost();
