import React, { useState, useEffect } from 'react';

function ConsumeReportDate({ onDateChange }) {  // onDateChange를 props로 받음
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [displayDate, setDisplayDate] = useState('');

    useEffect(() => {
        const today = new Date();
        const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = selectedYear === today.getFullYear() && selectedMonth === (today.getMonth() + 1)
            ? today.getDate()
            : lastDayOfMonth;

        setDisplayDate(`${selectedYear}. ${String(selectedMonth).padStart(2, '0')}. 01 ~ ${selectedYear}. ${String(selectedMonth).padStart(2, '0')}. ${String(endDate).padStart(2, '0')}`);
        if (onDateChange) {
            onDateChange(selectedYear, selectedMonth);  // onDateChange 함수 호출
        }
    }, [selectedYear, selectedMonth, onDateChange]);

    const handleYearChange = (event) => {
        setSelectedYear(Number(event.target.value));
        if (Number(event.target.value) === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth);
        }
    };

    const handleMonthChange = (event) => {
        setSelectedMonth(Number(event.target.value));
    };

    const generateYearOptions = () => {
        const options = [];
        for (let year = currentYear; year >= 2023; year--) {
            options.push(
                <option key={year} value={year}>
                    {year}년
                </option>
            );
        }
        return options;
    };

    const generateMonthOptions = () => {
        const options = [];
        const maxMonth = selectedYear === currentYear ? currentMonth : 12;

        for (let month = 1; month <= maxMonth; month++) {
            options.push(
                <option key={month} value={month}>
                    {String(month).padStart(2, '0')}월
                </option>
            );
        }
        return options;
    };

    return (
        <div className='consume-report-date-container'>
            <div className='consume-report-date-section'>
                <select value={selectedYear} onChange={handleYearChange}>
                    {generateYearOptions()}
                </select>
                <select value={selectedMonth} onChange={handleMonthChange}>
                    {generateMonthOptions()}
                </select>
            </div>
            <p className='displayed-date'>{displayDate}</p>
        </div>
    );
}

export default ConsumeReportDate;
