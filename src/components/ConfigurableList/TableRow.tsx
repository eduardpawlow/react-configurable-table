import React, { ReactNode, Ref, useRef } from 'react';

import { InputCheckbox } from '@nebo-team/vobaza.ui.inputs.input-checkbox';

import { useDrag, useDrop } from 'react-dnd';

import { Icon } from '@nebo-team/vobaza.ui.icon';

import type { FC } from 'react';
import type { ColConfig } from './index';

import styles from './styles.module.scss';

interface ChangeRowsOrderEvent {
  type: string;
  movingItem: any;
  targetItem: any;
}

interface TableRow extends React.RefAttributes<any> {
  className: string;
  beforeRowAddons?: Array<ReactNode>;
  keyField: string;
  data: any;
  cols: ColConfig[];
  gridTemplate: string;
  isSelected?: boolean;
  tableName?: string;
  onClickCheckbox?: (
    keyFieldValue: number | string
  ) => (value: boolean) => void;
  onChangeRowsOrder?: (event: ChangeRowsOrderEvent) => void;
}

const TableCell: FC = ({ children }) => {
  return <div className={styles.tableCol}>{children}</div>;
};

const TableRowCheckbox = (props: any) => {
  const { isSelected, onChange } = props;

  return (
    <div className={styles.tableCol}>
      <InputCheckbox label="" initialValue={isSelected} onChange={onChange} />
    </div>
  );
};

function TableRowWithSelect(RowComponent: FC<TableRow>) {
  const WrappedRow = React.forwardRef(
    ({ ...props }: TableRow, ref: Ref<any>) => {
      const { keyField, data, isSelected, onClickCheckbox } = props;

      const handleChangeCheckbox =
        onClickCheckbox && onClickCheckbox(data[keyField]);

      const checkbox = (
        <TableRowCheckbox
          isSelected={isSelected}
          onChange={handleChangeCheckbox}
        />
      );

      props.beforeRowAddons = Array.isArray(props.beforeRowAddons)
        ? [...props.beforeRowAddons, checkbox]
        : [checkbox];

      return <RowComponent ref={ref} {...props} />;
    }
  );

  WrappedRow.displayName = 'TableRowWithSelect';

  return WrappedRow;
}

enum ElementPart {
  UP = 'UP',
  DOWN = 'DOWN',
}

const createIndicator = (part: string): HTMLDivElement => {
  const $el = document.createElement('div');
  const $line = document.createElement('div');

  $el.classList.add(styles.dropIdicator);
  $line.classList.add(styles.dropIndicatorLine);

  if (part) $el.classList.add(styles[`dropIdicator${part}`]);

  $el.appendChild($line);

  return $el;
};

const TableRowDragIcon = React.forwardRef((props, ref: Ref<any>) => {
  return (
    <div ref={ref} className={styles.tableCol}>
      <Icon name="DragLines" />
    </div>
  );
});

TableRowDragIcon.displayName = 'TableRowDragIcon';

function TableRowWithDnD(RowComponent: FC<TableRow>) {
  return function WrappedRow({ ...props }: TableRow) {
    const { tableName = '', keyField, data, onChangeRowsOrder } = props;

    const dndType = tableName + '_ROW';

    const dragElemRef = useRef(null);
    const rowElemRef = useRef(null);
    const isDragEnter = useRef(false);
    const lastHoveredPart = useRef('');
    const indicatorRef = useRef<HTMLElement | null>(null);

    const getListItemHoveredPart = (monitor: any) => {
      if (!rowElemRef.current) return;

      const $hoveredEl = rowElemRef.current as HTMLElement;

      const clientOffset = monitor.getClientOffset();
      const hoverBoundingRect = $hoveredEl.getBoundingClientRect();

      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (hoverClientY > hoverMiddleY) return ElementPart.DOWN;

      return ElementPart.UP;
    };

    const resetIndicator = () => {
      isDragEnter.current = false;
      indicatorRef.current!.remove();
      lastHoveredPart.current = '';
    };

    const [{ isOver }, drop] = useDrop({
      accept: dndType,
      collect(monitor) {
        return {
          isOver: monitor.isOver(),
        };
      },
      hover(item: any, monitor) {
        if (!rowElemRef.current) return;
        // Don't replace items with themselves
        if (item[keyField] === data[keyField]) return;
        const hoveredPart = getListItemHoveredPart(monitor);

        if (!hoveredPart || hoveredPart === lastHoveredPart.current) return;

        const $hoveredEl = rowElemRef.current as HTMLElement;

        if (indicatorRef.current) indicatorRef.current.remove();
        indicatorRef.current = createIndicator(hoveredPart!);

        $hoveredEl.appendChild(indicatorRef.current);

        lastHoveredPart.current = hoveredPart!;

        if (!isDragEnter.current) {
          isDragEnter.current = true;
          $hoveredEl.addEventListener('dragleave', resetIndicator, {
            once: true,
          });
        }
      },
      drop(item: any, monitor) {
        if (!rowElemRef.current || item.id === data.id) return;

        resetIndicator();

        if (!!onChangeRowsOrder) {
          const hoveredPart = getListItemHoveredPart(monitor);
          const type = hoveredPart === ElementPart.UP ? 'BEFORE' : 'AFTER';

          onChangeRowsOrder({
            type: type,
            movingItem: item,
            targetItem: data,
          });
        }
      },
      options: {
        dropEffect: 'copy',
      },
    });

    const [{}, drag, preview] = useDrag({
      type: dndType,
      item: (): any => {
        return data;
      },
    });

    drag(dragElemRef);
    drop(preview(rowElemRef));

    const dndIcon = <TableRowDragIcon ref={dragElemRef} />;

    props.beforeRowAddons = Array.isArray(props.beforeRowAddons)
      ? [...props.beforeRowAddons, dndIcon]
      : [dndIcon];

    const updatedClasses = [
      props.className || '',
      isOver ? styles.tableRowHovered : '',
    ].join(' ');

    return (
      <RowComponent ref={rowElemRef} {...props} className={updatedClasses} />
    );
  };
}

const TableRow: FC<TableRow> = React.forwardRef<HTMLDivElement, TableRow>(
  (props, ref: Ref<any>) => {
    const { className, keyField, cols, data, gridTemplate, beforeRowAddons } =
      props;

    const renderCell = (col: ColConfig, index: number) => {
      let content: string | ReactNode = '';

      if (col.render) content = col.render(data);
      else if (col.fieldname) content = data[col.fieldname];

      return (
        <TableCell key={`${data[keyField]}-${index}`}>{content}</TableCell>
      );
    };

    const cssClasses = [className || '', styles.tableRow].join(' ');

    return (
      <div
        ref={ref}
        className={cssClasses}
        style={{
          gridTemplateColumns: gridTemplate,
        }}
      >
        {beforeRowAddons}
        {cols.map(renderCell)}
      </div>
    );
  }
);

TableRow.displayName = 'TableRow';

export { TableCell, TableRow, TableRowWithDnD, TableRowWithSelect };
export type { ChangeRowsOrderEvent };
