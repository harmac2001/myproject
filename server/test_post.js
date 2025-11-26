const fetch = require('node-fetch');

async function testPost() {
    const data = {
        incident_date: '2023-11-15',
        status: 'Investigating',
        description: 'Test API',
        ship_id: '',
        member_id: '',
        club_id: '',
        handler_id: '',
        local_office_id: '',
        type_id: '',
        reporter_id: '',
        local_agent_id: '',
        place_id: '',
        closing_date: '',
        estimated_disposal_date: '',
        berthing_date: '',
        voyage_and_leg: '',
        club_reference: '',
        reporting_date: '',
        time_bar_date: '',
        latest_report_date: '',
        next_review_date: ''
    };

    try {
        const response = await fetch('http://localhost:5000/api/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('Success');
        } else {
            const text = await response.text();
            console.log('Failed:', response.status, text);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

testPost();
