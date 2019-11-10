
import React, { Component } from 'react';

export default class DuplicatePrimitiveIcon extends Component {

  constructor(props, context){
    super(props, context);
  }

  componentDidMount(){
    if (this.props.getRef) this.props.getRef(this.ref);
  }

  render(){
    return (
      <svg {...this.props} ref={ref => this.ref = ref} width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  {/* Generator: Sketch 46.2 (44496) - http://www.bohemiancoding.com/sketch */}
  <title>DuplicatePrimitiveIcon</title>
  <desc>Created with Sketch.</desc>
  <defs>
    <rect id="path-1" x={7} y={7} width={17} height={17} rx={5} />
    <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x={0} y={0} width={17} height={17} fill="white">
      <use xlinkHref="#path-1" />
    </mask>
    <rect id="path-3" x={7} y={7} width={17} height={17} rx={5} />
    <mask id="mask-4" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x={0} y={0} width={17} height={17} fill="white">
      <use xlinkHref="#path-3" />
    </mask>
    <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="linearGradient-5">
      <stop stopColor="#A6AAAB" stopOpacity="0.176177536" offset="0%" />
      <stop stopColor="#6D7173" stopOpacity="0.176177536" offset="100%" />
    </linearGradient>
    <rect id="path-6" x={0} y={0} width={17} height={17} rx={5} />
  </defs>
  <g id="Site-Mockups" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
    <g id="Modification" transform="translate(-1216.000000, -922.000000)">
      <g id="Floating-Toolbar-Concept-Mobile" transform="translate(1106.000000, 906.000000)">
        <g id="Controls" transform="translate(15.000000, 0.000000)">
          <g id="DuplicatePrimitiveIcon" transform="translate(95.000000, 16.000000)">
            <g id="Duplicate-Icon">
              <use id="Selected-Object-Copy" strokeOpacity="0.176177536" stroke="#6D7173" mask="url(#mask-2)" strokeWidth={2} strokeDasharray={2} xlinkHref="#path-1" />
              <use id="Selected-Object-Copy-3" strokeOpacity="0.176177536" stroke="#6D7173" mask="url(#mask-4)" strokeWidth={2} strokeDasharray={2} xlinkHref="#path-3" />
              <g id="Selected-Object-Copy-2">
                <use fill="#E5EAFE" fillRule="evenodd" xlinkHref="#path-6" />
                <rect stroke="url(#linearGradient-5)" strokeWidth={1} x="0.5" y="0.5" width={16} height={16} rx={5} />
              </g>
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