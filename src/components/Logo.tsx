import React from "react";

type LogoProps = {
  size?: number;
  alt?: string;
  className?: string;
};

export const Logo: React.FC<LogoProps> = ({ size = 40, alt = "Logo", className }) => (
  <img src="/logo2.png" alt={alt} style={{ height: size, width: "auto" }} className={className} />
);

export default Logo;
