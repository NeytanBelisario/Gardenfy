import { useRef, useState } from 'react';

export function useNavbarVisibilityOnScroll() {
  const [hidden, setHidden] = useState(false);
  const lastOffsetRef = useRef(0);

  const handleScroll = (offsetY: number) => {
    const previousOffset = lastOffsetRef.current;
    const scrollingDown = offsetY > previousOffset;
    const scrollingUp = offsetY < previousOffset;

    if (scrollingDown && offsetY > 24 && !hidden) {
      setHidden(true);
    } else if ((scrollingUp || offsetY <= 8) && hidden) {
      setHidden(false);
    }

    lastOffsetRef.current = offsetY;
  };

  return {
    navbarHidden: hidden,
    handleNavbarScroll: handleScroll,
  };
}
