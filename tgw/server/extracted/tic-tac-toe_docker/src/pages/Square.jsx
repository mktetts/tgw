import React from 'react';
import xImage from '../assets/images/base.svg';
import oImage from '../assets/images/polygon.svg';

const Square = ({ value, onClick, isClickable }) => {
    const renderImage = value => {
        if (value === 'X') {
            return <img src={xImage} alt='X' height={70} width={70} />;
        } else if (value === 'O') {
            return <img src={oImage} alt='O' height={70} width={70} />;
        } else {
            return null;
        }
    };

    return (
        <button className='square' onClick={onClick} disabled={!isClickable}>
            {renderImage(value)}
        </button>
    );
};

export default Square;
