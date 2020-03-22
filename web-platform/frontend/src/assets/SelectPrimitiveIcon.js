
import React, { Component } from 'react';

export default class SelectPrimitiveIcon extends Component {


  componentDidMount(){
    if (this.props.getRef) this.props.getRef(this.ref);
  }

  render(){
    return (
      <svg {...this.props} ref={ref => this.ref = ref} width="32px" height="33px" viewBox="0 0 32 33" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  {/* Generator: Sketch 46.2 (44496) - http://www.bohemiancoding.com/sketch */}
  <title>SelectPrimitiveIcon</title>
  <desc>Created with Sketch.</desc>
  <defs>
    <rect id="path-1" x={0} y={0} width={24} height={24} rx={5} />
    <path d="M11.9753098,0.716849817 L7.82151059,11.6679111 C7.63270154,12.1714081 7.00333803,12.0455339 6.87746533,11.6679111 L4.9893748,7.32524884 C4.92643845,7.19937457 4.8635021,7.0735003 4.73762939,7.01056317 L0.332084819,5.12244916 C-0.0455332869,4.9965749 -0.171405989,4.36720356 0.332084819,4.17839216 L11.3459463,0.0245413477 C11.7235644,-0.101332919 12.1011825,0.276289882 11.9753098,0.716849817 Z" id="path-2" />
  </defs>
  <g id="Site-Mockups" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
    <g id="Modification" transform="translate(-1121.000000, -921.000000)">
      <g id="Floating-Toolbar-Concept-Mobile" transform="translate(1106.000000, 906.000000)">
        <g id="Controls" transform="translate(15.000000, 0.000000)">
          <g id="SelectPrimitiveIcon" transform="translate(0.000000, 15.000000)">
            <g id="Selected-Object">
              <use fill="#E5EAFE" fillRule="evenodd" xlinkHref="#path-1" />
              <rect strokeOpacity="0.176177536" stroke="#6D7173" strokeWidth={1} x="0.5" y="0.5" width={23} height={23} rx={5} />
            </g>
            <g id="Cursor-Icon" transform="translate(24.000000, 25.000000) scale(-1, 1) translate(-24.000000, -25.000000) translate(18.000000, 19.000000)">
              <g id="Shape">
                <use fill="#6D7173" fillRule="evenodd" xlinkHref="#path-2" />
                <path stroke="#FFFFFF" strokeWidth={2} d="M4.12187152,7.83444071 L0.015853515,6.07113128 C-1.2574894,5.64667837 -1.40818194,3.76299821 -0.0207996558,3.24272526 L11.0297149,-0.924140771 C12.2082555,-1.3169925 13.273145,-0.185533278 12.9368346,0.991567787 L12.9103088,1.0715002 L8.75784121,12.0190307 C8.23691368,13.408188 6.35322757,13.2574913 5.96039346,12.066633 L4.12187152,7.83444071 Z" />
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