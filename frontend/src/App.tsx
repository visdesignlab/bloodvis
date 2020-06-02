import React, { FC, useEffect, useState } from 'react';
import Store from './Interfaces/Store'
import { inject, observer } from 'mobx-react';
import Dashboard from './Dashboard';
import { BrowserRouter, Switch, Route, NavLink } from 'react-router-dom'

import Login from './LogIn'
import Home from './Home'

interface OwnProps {
  store?: Store;
}

type Props = OwnProps;

const App: FC<Props> = ({ store }: Props) => {
  const {
    dateRange
  } = store!;

  const [hemoData, setHemoData] = useState<any>([])

  async function cacheHemoData() {
    const resHemo = await fetch("http://localhost:8000/api/hemoglobin");
    const dataHemo = await resHemo.json();
    const resultHemo = dataHemo.result;
    const resTrans = await fetch(`http://localhost:8000/api/request_transfused_units?transfusion_type=ALL_UNITS&date_range=${dateRange}`)
    const dataTrans = await resTrans.json();
    //const resultTrans = dataTrans.result;
    // console.log(dataHemo, dataTrans)
    let transfused_dict = {} as any;
    // let caseIDReference = {} as any;
    let result: {
      CASE_ID: number,
      VISIT_ID: number,
      PATIENT_ID: number,
      ANESTHOLOGIST_ID: number,
      SURGEON_ID: number,
      YEAR: number,
      QUARTER: string,
      MONTH: string,
      DATE: Date | null,
      PRBC_UNITS: number,
      FFP_UNITS: number,
      PLT_UNITS: number,
      CRYO_UNITS: number,
      CELL_SAVER_ML: number,
      HEMO: number[]
    }[] = [];


    dataTrans.forEach((element: any) => {
      transfused_dict[element.case_id] = {
        PRBC_UNITS: element.transfused_units[0] || 0,
        FFP_UNITS: element.transfused_units[1] || 0,
        PLT_UNITS: element.transfused_units[2] || 0,
        CRYO_UNITS: element.transfused_units[3] || 0,
        CELL_SAVER_ML: element.transfused_units[4] || 0
      };
    });

    resultHemo.map((ob: any, index: number) => {
      if (transfused_dict[ob.CASE_ID]) {
        const transfusedResult = transfused_dict[ob.CASE_ID];
        result.push({
          CASE_ID: ob.CASE_ID,
          VISIT_ID: ob.VISIT_ID,
          PATIENT_ID: ob.PATIENT_ID,
          ANESTHOLOGIST_ID: ob.ANESTHOLOGIST_ID,
          SURGEON_ID: ob.SURGEON_ID,
          YEAR: ob.YEAR,
          PRBC_UNITS: transfusedResult.PRBC_UNITS,
          FFP_UNITS: transfusedResult.FFP_UNITS,
          PLT_UNITS: transfusedResult.PLT_UNITS,
          CRYO_UNITS: transfusedResult.CRYO_UNITS,
          CELL_SAVER_ML: transfusedResult.CELL_SAVER_ML,
          HEMO: ob.HEMO,
          QUARTER: ob.QUARTER,
          MONTH: ob.MONTH,
          DATE: ob.DATE
        })
      }
    })

    result = result.filter((d: any) => d);
    console.log("hemo data done")
    setHemoData(result)

  }

  useEffect(() => {
    cacheHemoData();
  }, []);



  return (

    <Login />
    // <Dashboard hemoData={hemoData} />
  );
}

export default inject('store')(observer(App));
