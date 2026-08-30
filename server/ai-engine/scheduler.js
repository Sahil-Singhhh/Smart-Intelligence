/**
 * Spaced Repetition Scheduler Algorithm (Ebbinghaus Forgetting Curve + SuperMemo SM-2)
 * @param {string} complexity - Easy | Medium | Hard
 * @param {string} priority - Low | Medium | High
 * @param {number|null} last_score - Percentage score (0 to 100)
 * @param {number} current_interval - Previous interval in days
 * @param {number} ease_factor - Topic ease factor (default 2.5)
 * @returns {Object} { next_revision_date, days_until_next, new_ease_factor, recommendation }
 */
const calculate_smart_schedule = (complexity, priority, last_score = null, current_interval = 0, ease_factor = 2.5) => {
    current_interval = parseInt(current_interval) || 0;
    ease_factor = parseFloat(ease_factor) || 2.5;

    const comp_map = { "Easy": 0.8, "Medium": 1.0, "Hard": 1.3 };
    const comp_multiplier = comp_map[complexity] || 1.0;

    let next_interval = 1;
    let new_ease_factor = ease_factor;
    let recommendation = "";

    if (last_score !== null && last_score !== undefined) {
        const score = parseInt(last_score);

        // 1. LOW SCORE (< 60%): Reset learning cycle for immediate review (Tomorrow)
        if (score < 60) {
            next_interval = 1; // Immediate review tomorrow
            new_ease_factor = Math.max(1.3, ease_factor - 0.2);
            recommendation = `Low Score (${score}%). Learning cycle reset to 1 day for urgent concept reinforcement.`;
        } 
        // 2. HIGH SCORE (>= 80%): Expand learning cycle for Long-Term Memory Retention
        else if (score >= 80) {
            if (current_interval <= 1) {
                next_interval = 7; // 1 week
            } else if (current_interval <= 7) {
                next_interval = 14; // 2 weeks
            } else {
                next_interval = 30; // 1 month long-term memory retention
            }

            // Adjust for topic complexity
            next_interval = Math.round(next_interval / comp_multiplier);
            new_ease_factor = Math.min(3.0, ease_factor + 0.15);
            recommendation = `High Score (${score}%). Topic scheduled for long-term memory retention review in ${next_interval} days.`;
        } 
        // 3. MEDIUM SCORE (60% - 79%): Moderate Spaced Interval
        else {
            next_interval = current_interval === 0 ? 3 : Math.round((current_interval * 1.5) / comp_multiplier);
            next_interval = Math.max(3, next_interval);
            recommendation = `Moderate Score (${score}%). Scheduled for follow-up evaluation in ${next_interval} days.`;
        }
    } else {
        next_interval = complexity === "Hard" ? 1 : 2;
        recommendation = "Initial study schedule initialized.";
    }

    next_interval = Math.max(1, Math.round(next_interval));

    const today = new Date();
    const next_revision_date = new Date(today);
    next_revision_date.setDate(today.getDate() + next_interval);

    return {
        next_revision_date,
        days_until_next: next_interval,
        new_ease_factor: parseFloat(new_ease_factor.toFixed(2)),
        recommendation
    };
};

module.exports = { calculate_smart_schedule };
