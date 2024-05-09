export default function isOperatingHour(): boolean {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Check if time is exactly between 6:00 AM and 4:00 PM
    const currentTimeInMinutes = hours * 60 + minutes;
    const start = 8 * 60;   // 6:00 AM in minutes
    const end = 16 * 60;    // 4:00 PM in minutes

    return currentTimeInMinutes >= start && currentTimeInMinutes < end;
}
