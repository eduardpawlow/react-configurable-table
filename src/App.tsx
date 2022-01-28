import React, { useEffect, useState } from "react";

import "./App.css";

import { Preloader } from "@nebo-team/vobaza.ui.preloader";
import { ConfigurableList } from "./components/ConfigurableList";

import type { IUser } from "./models/IUser";
import type { ColConfig } from "./components/ConfigurableList";
import type { ChangeRowsOrderEvent } from "./components/ConfigurableList/TableRow";

import { userListMock } from "./mocks/users";

const colsConfig: ColConfig[] = [
  {
    title: "ID",
    size: "small",
    fieldname: "id",
  },
  {
    title: "Имя",
    size: "medium",
    fieldname: "name",
  },
  {
    title: "Имя",
    size: "medium",
    fieldname: "email",
  },
  {
    title: "Сайт",
    size: "medium",
    fieldname: "website",
  },
  {
    title: "Адрес",
    size: "medium",
    render: (rowData: IUser) =>
      `${rowData.address.city}, ${rowData.address.street}`,
  },
];

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [list, setList] = useState<Array<IUser> | null>(null);

  useEffect(() => {
    setList(userListMock);
  }, []);

  const moveRowBeforeOrAfter = (event: ChangeRowsOrderEvent) => {
    if (!list) return;

    const moveType = event.type;
    const newBannerList = [...list];

    const movingItemIndex = newBannerList.findIndex(
      (t: any) => t.id === event.movingItem.id
    );

    const targetItemIndex = newBannerList.findIndex(
      (t: any) => t.id === event.targetItem.id
    );

    newBannerList.splice(movingItemIndex, 1);

    if (moveType === "BEFORE") {
      newBannerList.splice(targetItemIndex, 0, event.movingItem);
    } else if (moveType === "AFTER") {
      newBannerList.splice(targetItemIndex + 1, 0, event.movingItem);
    }

    setList(newBannerList);
  };

  const handleChangeRowsOrder = async (event: ChangeRowsOrderEvent) => {
    setIsLoading(true);
    try {
      // API CALL
      moveRowBeforeOrAfter(event);
    } catch (err) {}
    setIsLoading(false);
  };

  return (
    <div className="App">
      <div className="container">
        {list ? (
          <div className="table-wrapper">
            <ConfigurableList
              cols={colsConfig}
              list={list}
              busy={isLoading}
              canChangeRowsSort
              onChangeRowsOrder={handleChangeRowsOrder}
            />
          </div>
        ) : (
          <Preloader />
        )}
      </div>
    </div>
  );
}

export default App;
