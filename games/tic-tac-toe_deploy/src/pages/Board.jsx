import React from 'react';
import Square from './Square';

const Board = ({ squares, onClick, currentPlayer }) => {
    return (
        <div className='gameboard'>
            {squares.map((square, i) => (
                <Square key={i} value={square} onClick={() => onClick(i)} isClickable={!square && (currentPlayer === 'X' || currentPlayer === 'O')} />
            ))}
        </div>
    );
};

export default Board;
