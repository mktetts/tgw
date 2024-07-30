import React from 'react'
import Spinner from 'react-bootstrap/Spinner';

function Spinners(props) {
  return (
    <div>
        {props.on && (
            <Spinner animation="border" size='sm'/>
        )}
    </div>
  )
}

export default Spinners