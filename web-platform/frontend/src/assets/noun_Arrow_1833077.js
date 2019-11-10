
import React, { Component } from 'react';

export default class noun_Arrow_1833077 extends Component {

  constructor(props, context){
    super(props, context);
  }

  componentDidMount(){
    if (this.props.getRef) this.props.getRef(this.ref);
  }

  render(){
    return (
      <svg {...this.props} ref={ref => this.ref = ref} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 21 47.5" version="1.1" x="0px" y="0px"><title>Arrow_simple_rightt</title><desc>Created with Sketch.</desc><g stroke="none" strokeWidth={1} fill="none" fillRule="evenodd"><g transform="translate(-709.000000, -295.000000)" fill="#000000"><g transform="translate(709.000000, 295.000000)"><path d="M3.08,1.28 C2.48898049,0.729282279 1.56798056,0.745532248 0.996756402,1.3167564 C0.425532248,1.88798056 0.409282279,2.80898049 0.96,3.4 L16.96,19.4 L0.96,34.84 C0.409282279,35.4310195 0.425532248,36.3520194 0.996756402,36.9232436 C1.56798056,37.4944678 2.48898049,37.5107177 3.08,36.96 L20.92,19.4 L3.08,1.28 Z" /></g></g></g><text x={0} y={53} fill="#000000" fontSize="5px" fontWeight="bold" fontFamily="'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif">Created by Abdul karim</text><text x={0} y={58} fill="#000000" fontSize="5px" fontWeight="bold" fontFamily="'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif">from the Noun Project</text></svg>
    );
  }
}