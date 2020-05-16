
import React, { Component } from 'react';

export default class BackIcon extends Component {

  componentDidMount(){
    if (this.props.getRef) this.props.getRef(this.ref);
  }

  render(){
    return (
      <svg {...this.props} ref={ref => this.ref = ref} width="15px" height="13px" viewBox="0 0 15 13" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  {/* Generator: Sketch 46.2 (44496) - http://www.bohemiancoding.com/sketch */}
  <title>BackIcon</title>
  <desc>Created with Sketch.</desc>
  <defs />
  <g id="Site-Mockups" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
    <g id="Modification" transform="translate(-1315.000000, -929.000000)" fillRule="nonzero" fill="#6D7173">
      <g id="Floating-Toolbar-Concept-Mobile" transform="translate(1106.000000, 906.000000)">
        <g id="Controls" transform="translate(15.000000, 0.000000)">
          <g id="Navigation" transform="translate(155.000000, 20.000000)">
            <g id="BackIcon" transform="translate(39.000000, 3.000000)">
              <path d="M14.031155,5.59044275 L3.2781155,5.59044275 L7.49088145,1.57573288 C7.86702127,1.21609311 7.86702127,0.629369608 7.49088145,0.269729831 C7.11360183,-0.0899099438 6.4969605,-0.0899099438 6.12082068,0.269729831 L0.281534954,5.83491089 C0.0911854105,6.01744709 -0.00113981763,6.25865565 0.00227963526,6.49986418 C0.00227963526,6.50529682 0,6.50964292 0,6.513989 L0,6.51507553 C0,6.52159467 0.00455927052,6.52920035 0.00455927052,6.53680602 C0.00797872341,6.64980465 0.0296352584,6.7617167 0.0752279637,6.86819615 C0.103723404,6.93230112 0.152735562,6.98445435 0.196048632,7.04204018 C0.226823708,7.08224159 0.243920973,7.13004867 0.281534954,7.16590401 L6.12082068,12.7310851 C6.4969605,13.0896383 7.11360183,13.0896383 7.49088145,12.7310851 C7.86702127,12.3714453 7.86702127,11.7836353 7.49088145,11.425082 L3.30775076,7.43753528 L14.031155,7.43753528 C14.5645897,7.43753528 15,7.02139619 15,6.51507553 C15,6.00658184 14.5645897,5.59044275 14.031155,5.59044275" id="Back-Button-Icon" />
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