
import React, { Component } from 'react';

export default class AddPrimitiveIcon extends Component {

  componentDidMount(){
    if (this.props.getRef) this.props.getRef(this.ref);
  }

  render(){
    return (
      <svg {...this.props} ref={ref => this.ref = ref} width="32px" height="32px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  {/* Generator: Sketch 46.2 (44496) - http://www.bohemiancoding.com/sketch */}
  <title>AddPrimitiveIcon</title>
  <desc>Created with Sketch.</desc>
  <defs>
    <rect id="path-1" x={0} y={0} width={24} height={24} rx={5} />
    <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x={0} y={0} width={24} height={24} fill="white">
      <use xlinkHref="#path-1" />
    </mask>
    <path d="M22.7586207,19.2413791 L22.7586207,22.7586157 L19.2413793,22.7586157 C18.5557862,22.7586157 18,23.3143812 18,24.000001 C18,24.6855733 18.5557862,25.2413801 19.2413793,25.2413801 L22.7586207,25.2413801 L22.7586207,28.7586209 C22.7586207,29.4442139 23.3144276,30 24,30 C24.6856138,30 25.2413793,29.4442139 25.2413793,28.7586209 L25.2413793,25.2413801 L28.7586207,25.2413801 C29.4442138,25.2413801 30,24.6855733 30,24.000001 C30,23.3143812 29.4442138,22.7586157 28.7586207,22.7586157 L25.2413793,22.7586157 L25.2413793,19.2413791 C25.2413793,18.5557861 24.6856138,18 24,18 C23.3144276,18 22.7586207,18.5557861 22.7586207,19.2413791 Z" id="path-3" />
  </defs>
  <g id="Site-Mockups" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
    <g id="Modification" transform="translate(-1165.000000, -921.000000)">
      <g id="Floating-Toolbar-Concept-Mobile" transform="translate(1106.000000, 906.000000)">
        <g id="Controls" transform="translate(15.000000, 0.000000)">
          <g id="AddPrimitiveIcon" transform="translate(44.000000, 15.000000)">
            <use id="Created-Object" strokeOpacity="0.36" stroke="#6D7173" mask="url(#mask-2)" strokeWidth={2} strokeDasharray={3} xlinkHref="#path-1" />
            <g id="Shape" fillRule="nonzero">
              <use fill="#6D7173" fillRule="evenodd" xlinkHref="#path-3" />
              <path stroke="#FFFFFF" strokeWidth={2} d="M26.2413793,21.7586157 L28.7586207,21.7586157 C29.9965048,21.7586157 31,22.7621027 31,24.000001 C31,25.2378627 29.9964939,26.2413801 28.7586207,26.2413801 L26.2413793,26.2413801 L26.2413793,28.7586209 C26.2413793,29.9965032 25.2378939,31 24,31 C22.7621383,31 21.7586207,29.9964941 21.7586207,28.7586209 L21.7586207,26.2413801 L19.2413793,26.2413801 C18.0035061,26.2413801 17,25.2378627 17,24.000001 C17,22.7621027 18.0034952,21.7586157 19.2413793,21.7586157 L21.7586207,21.7586157 L21.7586207,19.2413791 C21.7586207,18.0035059 22.7621383,17 24,17 C25.2378939,17 26.2413793,18.0034968 26.2413793,19.2413791 L26.2413793,21.7586157 Z" />
            </g>
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>
    );
  }
}