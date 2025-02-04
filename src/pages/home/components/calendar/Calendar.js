import './Calendar.css';

function Calendar() {
    const rows = 5;
    const cols = 7;

    const headerRow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const CalendarArray = Array.from({ length: rows * cols }, (_, index) => index + 1); // Flattened array

    return (
        <div className='calendar'>
            {/* Header Row */}
            <div className="header-row">
                {headerRow.map((day, index) => (
                    <div key={index} className="day header">{day}</div>
                ))}
            </div>

            {/* Calendar Days */}
            {CalendarArray.map((cell, index) => (
                <div key={index} className="day"></div>
            ))}
        </div>
    );
}

export default Calendar;