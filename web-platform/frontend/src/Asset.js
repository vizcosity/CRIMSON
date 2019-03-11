/**
 * Graphical assets for CRIMSON.
 *
 * @ Aaron Baw 2019
 */

import React, { Component } from 'react';
import { HashLoader } from 'react-spinners';
import ReactTooltip from 'react-tooltip';

const Loader = ({text, style}) =>   <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    ...style
  }}
  className="loading-container">
    <HashLoader
      sizeUnit={"px"}
      size={50}
      color={'#DEE3EB'}
  />
  <h3 style={{
    marginTop: '15px'
  }}> {text} </h3>
  </div>

const OverlayButton = ({icon, text, onClick, tooltip}) => <div data-tip={tooltip} onClick={onClick} className="overlay-button-container">
  {icon}
  <button className="overlay-button" >{text}</button>
  <ReactTooltip />
</div>


const LandingBackground = (props) => <svg {...props} style={{
  ...props.style,
  position: 'absolute',
  zIndex: '-1',
  bottom: '0'
}} width='1440' height='550' viewBox='0 0 1440 550' xmlns='http://www.w3.org/2000/svg'>
    <defs>
        <linearGradient x1='73.636%' y1='-72.051%' x2='36.158%' y2='100%' id='linearGradient-1'>
            <stop stopColor='#EBEFFE' offset='0%' />
            <stop stopColor='#0036FF' offset='100%' />
        </linearGradient>
        <linearGradient x1='60.898%' y1='-38.615%' x2='33.026%' y2='56.389%' id='linearGradient-2'>
            <stop stopColor='#D7DFFE' offset='0%' />
            <stop stopColor='#7BA6FF' offset='100%' />
        </linearGradient>
    </defs>
    <g id='Welcome' fill='none' fillRule='evenodd' opacity='0.2' strokeLinejoin='round'>
        <g id='Desktop-HD-Copy' transform='translate(0 -474)' stroke='#FFF' strokeWidth='5'>
            <g id='landing_background_wave_graphic' transform='translate(-508 477)'>
                <g id='Background_content'>
                    <path d='M60.5213818,254.360769 C202.052453,204.39924 446.204783,0.149773756 765.80291,0.149773756 C1085.40104,0.149773756 961.59894,448.018235 1716.54275,448.018235 C2471.48655,448.018235 1840.90737,732.504498 1840.90737,732.504498 L70.0676152,750.231719 C70.0676152,750.231719 -81.0096893,304.322299 60.5213818,254.360769 Z'
                    id='Wave_background_graphic_copy' strokeOpacity='0.06' fill='url(#linearGradient-1)'
                    />
                    <path d='M209.391101,496.976281 C350.922172,447.014751 595.076,242.768281 914.673228,242.768281 C1234.27046,242.768281 1110.46926,690.633747 1865.41247,690.633747 C2620.35567,690.633747 1853.95818,968.029719 1853.95818,968.029719 L218.937334,992.850226 C218.937334,992.850226 67.86003,546.93781 209.391101,496.976281 Z'
                    id='Wave_background_graphic' strokeOpacity='0.1' fill='url(#linearGradient-2)'
                    />
                </g>
            </g>
        </g>
    </g>
</svg>

export { LandingBackground, OverlayButton, Loader };
