import React, { useEffect, useState } from "react";
import { Element, categorizeElements, getGroupElements, GroupElements } from "./Element";
import "./App.css";
import GroupTabs from "./components/GroupTabs";
import { Events, ElementGroup, difficulties, element_groups } from "./Type";
import EventButtons from "./components/EventButtons";

import AddIcon from "@mui/icons-material/Add";
import AddBoxIcon from "@mui/icons-material/AddBox";
import CloseIcon from "@mui/icons-material/Close";
import {
  calculateDifficulty,
  calculateND,
  isCodeInRoutine,
  isDisabledElement,
  RoutineElement,
  updateRoutineWithElementGroupScore,
} from "./Routine";
import useMedia from "use-media";
import HeaderIcons from "./components/HeaderIcons";

const url = "http://localhost:8000/api/elements";

const App: React.FC = () => {
  const [categorizedElements, setCategorizedElements] = useState({});
  const [selectEvent, setSelectEvent] = useState(Events.床);
  const [selectGroup, setSelectGroup] = useState(ElementGroup.EG1);
  const [groupElements, setGroupElements] = useState({} as GroupElements);
  const [routineOpen, setRoutineOpen] = useState(0); // 0: 難度表 1: 半分 2:演技構成
  const [routine, setRoutine] = useState([] as RoutineElement[]);
  const isMobile = useMedia({ maxWidth: "calc(700px - 1px)" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        const newCategorizedElements = categorizeElements(data.elements);
        setCategorizedElements(newCategorizedElements);
        const newGroupElements = getGroupElements(
          newCategorizedElements,
          selectEvent,
          selectGroup
        );
        setGroupElements(newGroupElements);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (Object.keys(categorizedElements).length === 0) {
      return;
    }
    const newGroupElements = getGroupElements(
      categorizedElements,
      selectEvent,
      selectGroup
    );
    setGroupElements(newGroupElements);
  }, [selectEvent, selectGroup]);

  // 種目が変更された場合
  useEffect(() => {
    setSelectGroup(ElementGroup.EG1); // EG1を選択する
    setRoutine([]); // 演技構成をリセットする
  }, [selectEvent]);

  // 演技構成が変更された場合
  useEffect(() => {
    updateRoutineWithElementGroupScore(selectEvent, routine, setRoutine);
  }, [routine]);

  return (
    <div className="App">
      <div className="header">
        {isMobile ? (
          <>
            <div className="header__left">
              <h1 className="header__title">
                <a href="/">GymCal</a>
              </h1>
              <EventButtons
                selectEvent={selectEvent}
                setSelectEvent={setSelectEvent}
                isMobile={isMobile}
              />
            </div>
            <div className="header__right">
              <HeaderIcons
                routineOpen={routineOpen}
                setRoutineOpen={setRoutineOpen}
                isMobile={isMobile}
                badgeContent={routine.length}
              />
            </div>
          </>
        ) : (
          <>
            <div className="header__left">
              <h1 className="header__title">
                <a href="/">GymCal</a>
              </h1>
            </div>
            <EventButtons
              selectEvent={selectEvent}
              setSelectEvent={setSelectEvent}
              isMobile={isMobile}
            />
            <div className="header__right">
              <HeaderIcons
                routineOpen={routineOpen}
                setRoutineOpen={setRoutineOpen}
                isMobile={isMobile}
                badgeContent={routine.length}
              />
            </div>
          </>
        )}
      </div>
      {Object.keys(groupElements).length ? (
        <div className="main">
          <div
            className={`elements ${routineOpen === 0 ? "elements--full" : ""} ${
              routineOpen === 1 ? "elements--side" : ""
            }  ${routineOpen === 2 ? "elements--disabled" : ""}`}
          >
            <div className="elements__header">
              <GroupTabs
                selectEvent={selectEvent}
                selectGroup={selectGroup}
                setSelectGroup={setSelectGroup}
              />
            </div>
            <div className="elements__group">
              {Object.entries(groupElements as Object).map(([rowKey, rowElements]) => (
                <div className="elements__row" key={rowKey}>
                  {Object.entries(rowElements as Object).map(
                    ([difficultyKey, element]) => (
                      <React.Fragment key={`${rowKey}-${difficultyKey}`}>
                        {element.name ? (
                          <div
                            className={`elements__tile ${
                              isDisabledElement(routine, element)
                                ? "elements__tile--disabled"
                                : "elements__tile--active"
                            }`}
                            key={`${rowKey}-${difficultyKey}`}
                            onClick={() => {
                              if (isDisabledElement(routine, element)) {
                                setRoutine(routine.filter((e) => e.id !== element.id));
                                return;
                              }
                              setRoutine([...routine, element]);
                            }}
                          >
                            <div className="elements__label-box">
                              <span className="elements__difficulty">
                                {difficultyKey}
                              </span>
                              {element.alias && (
                                <span className="elements__alias">{element.alias}</span>
                              )}
                            </div>
                            <div>{element.name}</div>
                          </div>
                        ) : (
                          <div
                            className="elements__tile"
                            key={`${rowKey}-${difficultyKey}`}
                          ></div>
                        )}
                      </React.Fragment>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            className={`routine ${routineOpen === 0 ? "routine--disabled" : ""} ${
              routineOpen === 1 ? "routine--side" : ""
            } ${routineOpen === 2 ? "routine--full" : ""}`}
          >
            <div className="routine__header">
              Dスコア: {calculateDifficulty(routine)} (ND:{calculateND(routine)})
            </div>
            {routine.length ? (
              <div className="routine__elements">
                <div className="routine__element">
                  <span className="routine__item">No.</span>
                  <span></span>
                  <span className="routine__item">名前</span>
                  <span className="routine__item">EG</span>
                  <span className="routine__item">難度</span>
                  <span className="routine__item">CV</span>
                </div>
                {routine.map((element, index) => (
                  <div className="routine__element" key={element.name}>
                    <span className="routine__item">{index + 1}</span>
                    <span
                      className={`routine__item routine__icon ${
                        element.connection ? "routine__icon--active" : ""
                      }`}
                      onClick={() => {
                        const newRoutine = routine.map((e, i) => {
                          if (i === index) {
                            return { ...e, connection: !e.connection };
                          }
                          return e;
                        });
                        setRoutine(newRoutine);
                      }}
                    >
                      {element.connection ? (
                        <AddBoxIcon
                          sx={{
                            fontSize: "1.5rem",
                          }}
                        />
                      ) : (
                        <AddIcon
                          sx={{
                            fontSize: "1rem",
                          }}
                        />
                      )}
                    </span>

                    <span className="routine__element--name">
                      {element.alias ? element.alias : element.name}
                    </span>
                    <span className="routine__item">
                      {element.element_group_score! > 0
                        ? `${element_groups[element.element_group - 1]}(${
                            element.element_group_score
                          })`
                        : `${element_groups[element.element_group - 1]}`}
                    </span>
                    <span className="routine__item">
                      {difficulties[element.difficulty - 1]}
                    </span>
                    <span className="routine__item">{/* 組み合わせ加点 */}</span>
                    <span className="routine__item routine__icon">
                      <CloseIcon
                        sx={{
                          fontSize: "1rem",
                        }}
                        onClick={() => setRoutine(routine.filter((e) => e !== element))}
                      />
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>演技構成はありません</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p>ただいま絶賛開発中です。</p>
          <p>もう少しお待ち下さい🙇</p>
        </div>
      )}
    </div>
  );
};

export default App;
