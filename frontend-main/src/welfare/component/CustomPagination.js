import React from 'react';
import 'welfare/css/CustomPagination.css';

function CustomPagination({ swiper }) {
    const { pagination } = swiper.params;
  
    return (
      <div className="customPagination">
        {pagination.el && (
          <div className="paginationContainer">
            {Array.from({ length: swiper.slides.length }).map((_, index) => (
              <div
                key={index}
                className={`paginationBullet ${
                  swiper.activeIndex === index ? "active" : ''
                }`}
                onClick={() => swiper.slideTo(index)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

export default CustomPagination;