import React, { CSSProperties } from 'react';
// @ts-ignore - react-window export issue
import { FixedSizeList } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  itemHeight?: number;
  render: (item: T, index: number) => React.ReactNode;
  height?: number;
}

export function VirtualList<T>({
  items,
  itemHeight = 88,
  render,
  height = 500,
}: VirtualListProps<T>) {
  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {({ index, style }: { index: number; style: CSSProperties }) => (
        <div style={style} key={index}>
          {render(items[index], index)}
        </div>
      )}
    </FixedSizeList>
  );
}
