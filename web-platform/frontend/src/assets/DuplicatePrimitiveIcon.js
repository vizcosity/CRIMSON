
import React, { Component } from 'react';

export default class DuplicatePrimitiveIcon extends Component {

  componentDidMount(){
    if (this.props.getRef) this.props.getRef(this.ref);
  }

  render(){
    return (
      <svg {...this.props} ref={ref => this.ref = ref} width="30px" height="30px" viewBox="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  {/* Generator: Sketch 46.2 (44496) - http://www.bohemiancoding.com/sketch */}
  <title>DuplicatePrimitiveIcon</title>
  <desc>Created with Sketch.</desc>
  <defs>
    <rect id="duplicate-path-1" x="8.57142857" y="8.57142857" width="21.4285714" height="21.4285714" rx={5} />
    <mask id="duplicate-mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x={0} y={0} width="21.4285714" height="21.4285714" fill="white">
      <use xlinkHref="#duplicate-path-1" />
    </mask>
    <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="duplicate-linearGradient-3">
      <stop stopColor="#A6AAAB" stopOpacity="0.176177536" offset="0%" />
      <stop stopColor="#6D7173" stopOpacity="0.176177536" offset="100%" />
    </linearGradient>
    <rect id="duplicate-path-4" x={0} y={0} width="21.4285714" height="21.4285714" rx={5} />
  </defs>
  <g id="duplicate-Site-Mockups" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
    <g id="duplicate-Modification" transform="translate(-1212.000000, -921.000000)">
      <g id="duplicate-Floating-Toolbar-Concept-Mobile" transform="translate(1106.000000, 906.000000)">
        <g id="duplicate-Controls" transform="translate(15.000000, 0.000000)">
          <g id="duplicate-DuplicatePrimitiveIcon" transform="translate(91.000000, 15.000000)">
            <use id="duplicate-Original-Object" strokeOpacity="0.36" stroke="#6D7173" mask="url(#duplicate-mask-2)" strokeWidth={2} strokeDasharray={2} xlinkHref="#duplicate-path-1" />
            <g id="duplicate-Duplicated-Object">
              <use fill="#E5EAFE" fillRule="evenodd" xlinkHref="#duplicate-path-4" />
              <rect stroke="url(#duplicate-linearGradient-3)" strokeWidth={1} x="0.5" y="0.5" width="20.4285714" height="20.4285714" rx={5} />
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