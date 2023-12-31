const dst = {
    2023: {start: {month: 2, day: 12}, end: {month: 10, day: 6}},
    2024: {start: {month: 2, day: 10}, end: {month: 10, day: 3}},
    2025: {start: {month: 2, day: 9}, end: {month: 10, day: 2}},
    2026: {start: {month: 2, day: 8}, end: {month: 10, day: 1}},
};

module.exports.getESTOffsetMillis = () => {
    // Get today's month and day
    const today = new Date();
    today.setHours(today.getUTCHours() - 5);
    const todayMonth = today.getUTCMonth();
    const todayDate = today.getUTCDate();

    // Get start and end of DST for this year
    const {start, end} = dst[today.getUTCFullYear().toString()];

    // Check if it's DST or not
    const isBeforeDST = todayMonth <= start.month && todayDate < start.day;
    if (isBeforeDST) return -5 * 60 * 60 * 1000;

    // Check if it's during DST
    const isDST = todayMonth >= end.month && todayDate <= end.day;
    if (isDST) return -4 * 60 * 60 * 1000;

    // It must be after DST.
    return -5 * 60 * 60 * 1000;
};
