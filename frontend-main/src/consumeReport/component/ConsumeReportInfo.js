import 'consumeReport/ConsumeReport.css';
import info from "image/icon/info.png";
import { call } from 'login/service/ApiService';
import { useEffect, useMemo, useState } from 'react';
import Chart from "react-apexcharts";
import { useLocation } from 'react-router-dom';
import ConsumeReportDate from './ConsumeReportDate'; // 날짜 선택 컴포넌트를 불러옴

function ConsumeReportInfo() {
    const [selectedFilter, setSelectedFilter] = useState('personal');
    const [selectedData, setSelectedData] = useState(null); // 클릭된 데이터를 저장하기 위한 상태
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // 툴팁 위치 상태
    const [data, setData] = useState([]); // API로부터 받은 데이터를 저장할 상태
    const [loading, setLoading] = useState(true); // 로딩 상태 추가

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const handleDateChange = (year, month) => {
        setSelectedYear(year);
        setSelectedMonth(month);
    };

    const location = useLocation();
    const cardList = location.state.value;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    const fetchData = async () => {
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

        try {
            const response = await call(`/api/v1/consumption/${cardList.cardId}/${startDate}/${endDate}`, "GET", null);
            setData(response);
            setLoading(false); 
        } catch (error) {
            console.error("Error fetching data:", error);
            console.log("cardId: " + cardList.cardId + "startDate: " + {startDate} + "endDate: " + {startDate})
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedYear, selectedMonth]);

    const getCategoryIcon = (categoryName) => {
        switch(categoryName) {
            case '식비':
                return '🍴';
            case '잡화':
                return '👜';
            case '교통':
                return '🚍';
            case '생활':
                return '🏠';
            case '쇼핑':
                return '🛒';
            case '유흥':
                return '🍷';
            case '의료':
                return '🏥';
            case '기타':
                return '💰';
            default:
                return ''; // 카테고리가 없는 경우 빈 값 반환
        }
    };

    const processedData = useMemo(() => {
        const labels = data.map(item => `${getCategoryIcon(item.categoryName)} ${item.categoryName}`);
        const series = data.map(item => item.amount);
        return { labels, series };
    }, [data]);

    const isAllZero = data.every(item => item.totalAmount === 0);

    const donutData = {
        series: processedData.series,
        options: {
            chart: {
                type: 'donut',
                fontFamily: 'inherit',
                events: {
                    dataPointSelection: (event, chartContext, config) => {
                        const dataIndex = config.dataPointIndex;
                        const label = donutData.options.labels[dataIndex];
                        const value = donutData.series[dataIndex];
                        const color = donutData.options.fill.colors[dataIndex]; 
                        const { clientX, clientY } = event; 
                        if (selectedData && selectedData.label === label) {
                            setSelectedData(null);
                        } else {
                            setSelectedData({ label, value, color });
                            setTooltipPosition({ x: clientX, y: clientY });
                        }
                    },
                    beforeMount: function () {
                        setSelectedData(null);
                    },
                }
            },
            legend: {
                show: false
            },
            tooltip: {
                enabled: false 
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '50%',
                    },
                    dataLabels: {
                        minAngleToShowLabel: 0
                    }
                }
            },
            labels: processedData.labels,
            dataLabels: {
                style: {
                    fontSize: '14px',
                    fontWeight: 'normal',
                },
            },
            fill: {
                colors: ['#6DD193', '#F56A71', '#E9A260', '#66B1B5', '#4AADE5', '#9B7F9E', '#615EDE', '#625B8B']
            },
            noData: {
                text: '소비 내역이 없습니다.',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: '#2c2c2c',
                    fontSize: '24px',
                    fontWeight: 'bold',
                }
            }
        },
    };

    const barData = {
        series: [{
            name: "지출",
            data: processedData.series
        }],
        options: {
            chart: {
                type: 'bar',
                fontFamily: 'inherit',
                toolbar: {
                    show: false
                },
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: '50%',
                    endingShape: 'rounded',
                    borderRadius: 5,
                    distributed: true,
                    rangeBarOverlap: true,
                    colors: {
                        backgroundBarColors: ['#d9d9d9'],
                        backgroundBarOpacity: 1,
                        backgroundBarRadius: 5,
                    },
                }
            },
            xaxis: {
                categories: processedData.labels,
                labels: {
                    show: false
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                },
                tickAmount: Math.max(...processedData.series) / 10
            },
            yaxis: {
                categories: processedData.labels,
                labels: {
                    style: {
                        colors: '#2c2c2c',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }
                }
            },
            grid: {
                show: false
            },
            legend: {
                show: false,
                position: 'left',
            },
            tooltip: {
                enabled: false
            },
            fill: {
                colors: ['#6DD193', '#F56A71', '#E9A260', '#66B1B5', '#4AADE5', '#9B7F9E', '#625B8B'],
                opacity: 1
            },
            dataLabels: {
                enabled: true,
                formatter: (value) => `${formatPrice(value)} 원`,
                textAnchor: 'middle',
                offsetX: 240,
                style: {
                    colors: ['#2c2c2c'],
                    fontSize: '14px',
                    fontWeight: 'bold',
                },
                dropShadow: {
                    enabled: false,
                },
                position: 'right'
            },
            states: {
                normal: {
                    filter: {
                        type: 'none',
                    }
                },
                inactive: {
                    filter: {
                        type: 'none',
                    }
                }
            },
            colors: ['#6DD193', '#F56A71', '#E9A260', '#66B1B5', '#4AADE5', '#9B7F9E', '#625B8B'],
        }
    };

    const totalPrice = useMemo(() => {
        return donutData.series.reduce((total, num) => total + num, 0);
    }, [donutData.series]);

    const renderChart = () => {
        if (loading) {
            return <div>Loading...</div>;
        }

        if (isAllZero) {
            return <div className='no-data-container'>
                    <img 
                        src={info} 
                        alt="지문 인증 로그인" 
                        className="no-data-image" 
                    />
                    <p className='no-data-text'>소비 내역이 없습니다.</p>
                    </div>;
        }

        return (
            <div className='chart-container'>
                <div className='circle-chart-container'>
                    <Chart
                        options={donutData.options}
                        series={donutData.series}
                        type="donut"
                    />
                </div>
                {selectedData && (
                    <div
                        className='tooltip'
                        style={{
                            position: 'absolute',
                            top: `${tooltipPosition.y}px`,
                            left: `${tooltipPosition.x}px`,
                            backgroundColor: selectedData.color,
                            padding: '4px 8px',
                            borderRadius: '8px',
                            pointerEvents: 'none',
                            border: 'none',
                            color: '#fff',
                            zIndex: 1000
                        }}
                    >
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedData.label}</p>
                        <p style={{ margin: 0 }}>{formatPrice(selectedData.value)} 원</p>
                    </div>
                )}
                <div className='bar-chart-container'>
                    <Chart
                        options={barData.options}
                        series={barData.series}
                        type="bar"
                        height={360}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className='consume-report-price-container'>
            <ConsumeReportDate onDateChange={handleDateChange} />
            <div className='consume-report-price-section'>
                <span className='total-price'>총 <span className='go-mainred'>{formatPrice(totalPrice)}</span> 원</span>
            </div>
            {renderChart()}
        </div>
    );
}

export default ConsumeReportInfo;
