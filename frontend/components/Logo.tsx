import React from "react";
import Svg, { Path } from "react-native-svg";

const Logo = () => {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="35"
      height="35"
    >
      <Path
        d="M30,20 C50,20, 70,40, 70,60 C70,80, 50,100, 30,100 C30,70, 30,30, 30,20 Z"
        fill="#7e57c2"
      />
    </Svg>
  );
};

export default Logo;
