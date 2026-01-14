import { GoogleCallback } from "wasp/server/api";

export const googleCallback: GoogleCallback = async (req, res, context) => {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
        return res.status(400).send('Missing code');
    }

    if (!state || typeof state !== 'string') {
        return res.status(400).send('Missing state');
    }

    // Decode user ID from state parameter
    let userId: string;
    try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        userId = stateData.userId;
        console.log('Decoded userId from state:', userId);
    } catch (error) {
        console.error('Failed to decode state:', error);
        return res.status(400).send('Invalid state parameter');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.WASP_WEB_SERVER_URL}/google/callback`;

    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();
        console.log('tokenResponse', tokenResponse);
        console.log('=== Google Token Response ===');
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token);
        console.log('Token Type:', tokens.token_type);
        console.log('Expires In:', tokens.expires_in);
        console.log('Scope:', tokens.scope);
        console.log('============================');

        if (tokens.error) {
            console.error('Google token exchange error:', tokens.error_description);
            return res.status(500).send('Failed to exchange code for tokens');
        }

        if (!tokens.refresh_token) {
            console.warn('⚠️ WARNING: No refresh token received from Google!');
            console.warn('This usually happens if the user has already authorized the app.');
            console.warn('To get a refresh token, revoke access at: https://myaccount.google.com/permissions');
        }

        // Use userId from state instead of context.user
        await context.entities.User.update({
            where: { id: userId },
            data: {
                googRefreshToken: tokens.refresh_token,
            },
        });

        // Get user to check businessId
        const user = await context.entities.User.findUnique({
            where: { id: userId },
        });

        if (user?.businessId) {
            await context.entities.Business.update({
                where: { id: user.businessId },
                data: { isGoogleCalendarConnected: true }
            });
        }

        res.redirect(`${process.env.WASP_WEB_CLIENT_URL}/app/integrations?success=google`);
    } catch (error) {
        console.error('Error in googleCallback:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const getGoogleAccessToken = async (refreshToken: string) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    const tokens = await response.json();

    if (tokens.error) {
        throw new Error(`Failed to refresh Google access token: ${tokens.error_description}`);
    }

    return tokens.access_token;
};
