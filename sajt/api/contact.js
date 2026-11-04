
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }

    try {
        const {
            ime,
            instagram_username,
            telefon,
            website
        } = req.body || {};

        // Spam zaštita
        if (website) {
            return res.status(200).json({
                success: true
            });
        }

        // Provjera obaveznih podataka
        if (
            typeof ime !== 'string' ||
            typeof instagram_username !== 'string' ||
            typeof telefon !== 'string' ||
            !ime.trim() ||
            !instagram_username.trim() ||
            !telefon.trim()
        ) {
            return res.status(400).json({
                error: 'Molimo popunite sva polja.'
            });
        }

        const name = ime.trim().slice(0, 100);
        const username = instagram_username.trim().replace(/^@/, '').slice(0, 100);
        const phone = telefon.trim().slice(0, 30);

        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is missing');

            return res.status(500).json({
                error: 'Email servis trenutno nije podešen.'
            });
        }

        // Slanje putem Resend API-ja
        const resendResponse = await fetch(
            'https://api.resend.com/emails',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'FlowClip <noreply@flowclip.me>',
                    to: ['office@flowclip.me'],
                    subject: 'Nova prijava sa FlowClip sajta',
                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;">
                            <h2 style="color:#2e3acc;">Nova FlowClip prijava</h2>

                            <p><strong>Ime i prezime:</strong> ${escapeHtml(name)}</p>

                            <p><strong>Instagram:</strong> @${escapeHtml(username)}</p>

                            <p><strong>WhatsApp telefon:</strong> ${escapeHtml(phone)}</p>

                            <hr style="border:1px solid #eee;margin:25px 0;">

                            <p style="color:#777;font-size:12px;">
                                Ova prijava je poslata putem flowclip.me
                            </p>
                        </div>
                    `,
                    text: `
Nova FlowClip prijava

Ime i prezime: ${name}
Instagram: @${username}
WhatsApp telefon: ${phone}
                    `
                })
            }
        );

        const result = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('Resend error:', result);

            return res.status(502).json({
                error: 'Email nije poslat. Pokušajte ponovo.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Prijava je uspješno poslata.'
        });

    } catch (error) {
        console.error('Contact API error:', error);

        return res.status(500).json({
            error: 'Došlo je do greške na serveru.'
        });
    }
};

// Zaštita od ubacivanja HTML koda u email
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function (character) {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return entities[character];
    });
}
