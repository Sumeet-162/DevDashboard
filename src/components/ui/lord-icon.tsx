import React from 'react';

interface LordIconProps {
  src: string;
  trigger?: 'hover' | 'click' | 'loop' | 'morph' | 'boomerang';
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
  colors?: string;
  stroke?: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': {
        src: string;
        trigger?: string;
        delay?: number;
        style?: React.CSSProperties;
        colors?: string;
        stroke?: number;
      };
    }
  }
}

const LordIcon: React.FC<LordIconProps> = ({
  src,
  trigger = 'hover',
  delay,
  style,
  className,
  colors,
  stroke,
  ...props
}) => {
  return (
    <lord-icon
      src={src}
      trigger={trigger}
      delay={delay}
      style={style}
      colors={colors}
      stroke={stroke}
      className={className}
      {...props}
    />
  );
};

export default LordIcon;
