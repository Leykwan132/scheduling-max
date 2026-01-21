/**
 * Guess timezone from phone number country code
 * Maps common country codes to their primary timezone
 */
export function getTimezoneFromPhone(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Country code to timezone mapping (using primary timezone for each country)
    const countryTimezones: Record<string, string> = {
        // North America
        '1': 'America/New_York', // US/Canada (default to Eastern)

        // Asia-Pacific
        '60': 'Asia/Kuala_Lumpur',  // Malaysia
        '61': 'Australia/Sydney',     // Australia
        '62': 'Asia/Jakarta',         // Indonesia
        '63': 'Asia/Manila',          // Philippines
        '64': 'Pacific/Auckland',     // New Zealand
        '65': 'Asia/Singapore',       // Singapore
        '66': 'Asia/Bangkok',         // Thailand
        '81': 'Asia/Tokyo',           // Japan
        '82': 'Asia/Seoul',           // South Korea
        '84': 'Asia/Ho_Chi_Minh',     // Vietnam
        '86': 'Asia/Shanghai',        // China
        '852': 'Asia/Hong_Kong',      // Hong Kong
        '853': 'Asia/Macau',          // Macau
        '886': 'Asia/Taipei',         // Taiwan
        '91': 'Asia/Kolkata',         // India
        '92': 'Asia/Karachi',         // Pakistan
        '93': 'Asia/Kabul',           // Afghanistan
        '94': 'Asia/Colombo',         // Sri Lanka
        '95': 'Asia/Yangon',          // Myanmar
        '98': 'Asia/Tehran',          // Iran

        // Europe
        '30': 'Europe/Athens',        // Greece
        '31': 'Europe/Amsterdam',     // Netherlands
        '32': 'Europe/Brussels',      // Belgium
        '33': 'Europe/Paris',         // France
        '34': 'Europe/Madrid',        // Spain
        '39': 'Europe/Rome',          // Italy
        '40': 'Europe/Bucharest',     // Romania
        '41': 'Europe/Zurich',        // Switzerland
        '43': 'Europe/Vienna',        // Austria
        '44': 'Europe/London',        // UK
        '45': 'Europe/Copenhagen',    // Denmark
        '46': 'Europe/Stockholm',     // Sweden
        '47': 'Europe/Oslo',          // Norway
        '48': 'Europe/Warsaw',        // Poland
        '49': 'Europe/Berlin',        // Germany

        // Middle East
        '20': 'Africa/Cairo',         // Egypt
        '27': 'Africa/Johannesburg',  // South Africa
        '90': 'Europe/Istanbul',      // Turkey
        '961': 'Asia/Beirut',         // Lebanon
        '962': 'Asia/Amman',          // Jordan
        '963': 'Asia/Damascus',       // Syria
        '964': 'Asia/Baghdad',        // Iraq
        '965': 'Asia/Kuwait',         // Kuwait
        '966': 'Asia/Riyadh',         // Saudi Arabia
        '967': 'Asia/Aden',           // Yemen
        '968': 'Asia/Muscat',         // Oman
        '971': 'Asia/Dubai',          // UAE
        '972': 'Asia/Jerusalem',      // Israel
        '973': 'Asia/Bahrain',        // Bahrain
        '974': 'Asia/Qatar',          // Qatar

        // South America
        '51': 'America/Lima',         // Peru
        '52': 'America/Mexico_City',  // Mexico
        '53': 'America/Havana',       // Cuba
        '54': 'America/Argentina/Buenos_Aires', // Argentina
        '55': 'America/Sao_Paulo',    // Brazil
        '56': 'America/Santiago',     // Chile
        '57': 'America/Bogota',       // Colombia
        '58': 'America/Caracas',      // Venezuela
    };

    // Try to match country codes (longest first for codes like 852, 886, etc.)
    const sortedCodes = Object.keys(countryTimezones).sort((a, b) => b.length - a.length);

    for (const code of sortedCodes) {
        if (cleaned.startsWith(code)) {
            console.log(`[getTimezoneFromPhone] Detected country code ${code} from phone ${phoneNumber}, timezone: ${countryTimezones[code]}`);
            return countryTimezones[code];
        }
    }

    // Default to UTC if we can't detect
    console.log(`[getTimezoneFromPhone] Could not detect timezone from phone ${phoneNumber}, defaulting to UTC`);
    return 'UTC';
}
