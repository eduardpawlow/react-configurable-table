import React, { FC, ReactNode, useEffect, useState } from "react";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Preloader } from "@nebo-team/vobaza.ui.preloader";
import { InputCheckbox } from "@nebo-team/vobaza.ui.inputs.input-checkbox";
import {
  TableCell,
  TableRowWithDnD,
  TableRowWithSelect,
  TableRow,
} from "./TableRow";

import type { ChangeRowsOrderEvent } from "./TableRow";

import styles from "./styles.module.scss";

enum ColsSizes {
  Small = "small",
  Medium = "medium",
  Large = "large",
}

type ColSize = "small" | "medium" | "large";

interface ColConfig {
  title?: string;
  fieldname?: string;
  size?: ColSize | number;
  render?: (item: any) => React.ReactNode;
}

const colsSizesMap = {
  [ColsSizes.Small]: 60,
  [ColsSizes.Medium]: 120,
  [ColsSizes.Large]: 220,
};

const getTemplateCols = (sizes: Array<ColSize | number | undefined> = []) => {
  const result: Array<number | string> = [];

  sizes.forEach((s) => {
    const defaultValue = colsSizesMap[ColsSizes.Medium];

    switch (typeof s) {
      case "string":
        result.push(colsSizesMap[s] || defaultValue);
        break;
      case "number":
        result.push(s);
        break;
      default:
        result.push(defaultValue);
    }
  });

  return result.map((t) => String(t) + "px").join(" ");
};
interface BaseTable {
  keyField?: string;
  name?: string;
  list: Array<any>;
  cols: ColConfig[];
  rowGridTemplate: string;
  flat?: boolean;
  busy?: boolean;
  emptyMsg?: string | ReactNode;
  selectable?: boolean;
  selected?: Array<string | number>;
  isAllSelected?: boolean;
  canChangeRowsSort?: boolean;
  onClickCheckbox?: (
    keyFieldValue: number | string
  ) => (value: boolean) => void;
  onChangeSelected?: (items: Array<string | number>) => void;
  onChangeRowsOrder?: (event: ChangeRowsOrderEvent) => void;
}

const TableHead: FC<any> = (props) => {
  const {
    cols,
    rowGridTemplate,
    selectable,
    isAllSelected,
    canChangeRowsSort,
    onClickCheckbox,
  } = props;

  return (
    <div className={styles.tableHead}>
      <div
        className={styles.tableRow}
        style={{ gridTemplateColumns: rowGridTemplate }}
      >
        {canChangeRowsSort && <div></div>}
        {selectable && (
          <div className={styles.tableCol}>
            <InputCheckbox
              label=""
              initialValue={isAllSelected}
              onChange={onClickCheckbox && onClickCheckbox("ALL")}
            />
          </div>
        )}
        {cols.map((col: ColConfig) => (
          <TableCell key={col.title}>{col.title || "-"}</TableCell>
        ))}
      </div>
    </div>
  );
};

const Table: FC<any> = (props) => {
  const { flat, busy, children } = props;

  const tableClass = flat ? styles.tableFlat : styles.table;

  return (
    <div className={tableClass}>
      {children}
      {busy && (
        <div className={styles.tablePreloader}>
          <Preloader />
        </div>
      )}
    </div>
  );
};

const TableBody: FC<any> = (props) => {
  const { children, emptyMsg = "Нет элементов" } = props;

  const isEmpty = !Array.isArray(children) || !children.length;

  return (
    <div className={styles.tableBody}>
      {!isEmpty && children}
      {isEmpty && <div className={styles.tableEmptyMsg}>{emptyMsg}</div>}
    </div>
  );
};

const BaseTable: FC<BaseTable> = (props) => {
  const {
    keyField = "id",
    name = "",
    rowGridTemplate = "",
    busy = false,
    flat = false,
    list,
    cols,
    emptyMsg,
    isAllSelected,
    selected,
    selectable = false,
    canChangeRowsSort = false,
    onClickCheckbox,
    onChangeRowsOrder,
  } = props;

  let RowComponent = TableRow;
  const commonRowProps = {
    cols,
    keyField,
    gridTemplate: rowGridTemplate,
  } as any;

  if (selectable) {
    RowComponent = TableRowWithSelect(RowComponent);
    Object.assign(commonRowProps, { onClickCheckbox });
  }

  if (canChangeRowsSort) {
    RowComponent = TableRowWithDnD(RowComponent);
    Object.assign(commonRowProps, { tableName: name, onChangeRowsOrder });
  }

  const renderTableRow = (item: any) => {
    let computedRowProps = { key: item[keyField], data: item } as any;

    if (selectable) {
      computedRowProps.isSelected =
        !!selected && selected!.includes(item[keyField]);
    }

    return <RowComponent {...commonRowProps} {...computedRowProps} />;
  };

  return (
    <Table busy={busy} flat={flat}>
      <TableHead
        cols={cols}
        rowGridTemplate={rowGridTemplate}
        selectable={selectable}
        isAllSelected={isAllSelected}
        canChangeRowsSort={canChangeRowsSort}
        onClickCheckbox={onClickCheckbox}
      />
      <TableBody emptyMsg={emptyMsg}>
        {list && list.map(renderTableRow)}
      </TableBody>
    </Table>
  );
};

function TableWithSelect(TableComponent: FC<BaseTable>) {
  return function WrappedTable({ ...props }: BaseTable) {
    const { list, selected, onChangeSelected } = props;

    const [selectedItems, setSelectedItems] = useState<Array<string | number>>(
      []
    );
    const [isAllSelected, setIsAllSelected] = useState<boolean>(false);

    useEffect(() => {
      if (selected) {
        setSelectedItems(selected);
        setIsAllSelected(!!selected.length && selected.length === list.length);
      }
    }, [selected, list]);

    const handleSelectItem = (keyFieldValue: string | number) => {
      return (value: boolean) => {
        let newSelected = [...selectedItems];
        if (value) {
          newSelected.push(keyFieldValue);

          if (newSelected.length === list.length) {
            setIsAllSelected(true);
          }
        } else {
          newSelected = newSelected.filter((t) => t !== keyFieldValue);
          setIsAllSelected(false);
        }

        onChangeSelected && onChangeSelected(newSelected);
      };
    };

    const handleChangeIsAllSelected = (value: boolean) => {
      if (value) {
        onChangeSelected && onChangeSelected(list.map((t) => t.id));
        setIsAllSelected(true);
      } else {
        setIsAllSelected(false);
        onChangeSelected && onChangeSelected([]);
      }
    };

    const handleClickCheckbox = (keyFieldValue: string | number) => {
      if (keyFieldValue === "ALL") return handleChangeIsAllSelected;

      return handleSelectItem(keyFieldValue);
    };

    return (
      <TableComponent
        {...props}
        selectable
        selected={selectedItems}
        isAllSelected={isAllSelected}
        onClickCheckbox={handleClickCheckbox}
      />
    );
  };
}

function TableWithChangeOrder(TableComponent: FC<BaseTable>) {
  return function WrappedTable({ ...props }: BaseTable) {
    return (
      <DndProvider backend={HTML5Backend}>
        <TableComponent {...props} canChangeRowsSort />
      </DndProvider>
    );
  };
}

interface ConfigurableList {
  keyField?: string;
  name?: string;
  list: Array<any>;
  cols: ColConfig[];
  selectable?: boolean;
  selected?: number[];
  flat?: boolean;
  busy?: boolean;
  emptyMsg?: string | ReactNode;
  canChangeRowsSort?: boolean;
  onChangeSelected?: (items: Array<string | number>) => void;
  onChangeRowsOrder?: (event: ChangeRowsOrderEvent) => void;
}

const ConfigurableList: FC<ConfigurableList> = (props) => {
  if (!Array.isArray(props.cols)) props.cols = [];

  let TableComponent = BaseTable;

  let rowGridTemplate = getTemplateCols(props.cols.map((t) => t.size));

  if (props.selectable) {
    TableComponent = TableWithSelect(TableComponent);
    rowGridTemplate = "25px " + rowGridTemplate;
  }

  if (props.canChangeRowsSort) {
    TableComponent = TableWithChangeOrder(TableComponent);
    rowGridTemplate = "20px " + rowGridTemplate;
  }

  return <TableComponent {...props} rowGridTemplate={rowGridTemplate} />;
};

export { ConfigurableList };
export type { ColConfig };
