import React from 'react';
import ConsumeReportInfo from 'consumeReport/component/ConsumeReportInfo';

import Header from 'header/Header';
import 'consumeReport/ConsumeReport.css';

function consumeReport() {
    return (
        <div className='consume-report-container'>
            <Header />
            <ConsumeReportInfo />
        </div>
    );
}

export default consumeReport;